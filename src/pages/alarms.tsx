import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import styled from "styled-components";
import AlarmComponent from "../components/elements/alarm";
import AlarmForm from "../components/elements/alarmForm";
import GamePage from "../components/elements/game";
import LoadingRotation from "../components/elements/loading";
import BaseLayout from "../components/layout/base";
import { Alarm } from "../types/types";
import { addAlarm, deleteAlarm, getMyAlarm } from "../utils/api";

const Main = styled.div`
  align-items: center;
  display: flex;
  flex-direction: column;
  gap: 1em;
  justify-content: center;

  @media (min-width: 1366px) {
    flex-direction: row;
  }
`;

const AlarmList = styled.div`
  align-items: center;
  display: flex;
  flex-direction: column;
  gap: 1em;
  justify-content: center;
  width: 100%;
`;

export default function AlarmPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [alarmActive, setAlarmActive] = useState(null as null | number);
  const [alarmSound, setAlarmSound] = useState(new Audio("/alarmSound.mp3"));

  const {
    data: alarmList,
    status,
    error,
  } = useQuery<Alarm[] | undefined>(["myAlarms"], getMyAlarm, {
    retry: 1,
  });

  function alarmChecker(alarmList: Alarm[]) {
    if (!alarmList) {
      return;
    }
    const time = new Date();
    const hourNow = time.getHours();
    const minuteNow = time.getMinutes();
    // console.log(alarmList);
    const alarmGoingOff = alarmList.find(
      ({ Hour, Minute }) => Hour === hourNow && Minute === minuteNow
    );

    if (alarmGoingOff) {
      setAlarmActive(alarmGoingOff.alarm_id);
    }
  }

  useEffect(() => {
    if (status === "success" && alarmList) {
      const checkAlarmInterval = setInterval(
        () => alarmChecker(alarmList),
        500
      );
      return () => clearInterval(checkAlarmInterval);
    }
  }, [status, alarmList]);

  useEffect(() => {
    if (alarmActive !== null) {
      alarmSound.loop = true;
      alarmSound.play();
      return () => alarmSound.pause();
    } else {
      alarmSound.pause();
    }
  }, [alarmActive, alarmSound]);

  const { mutateAsync: addAlarmAndMutate } = useMutation(addAlarm, {
    onSuccess: () => {
      queryClient.invalidateQueries(["myAlarms"]);
    },
  });

  const { mutateAsync: deleteAlarmAndMutate } = useMutation(deleteAlarm, {
    onSuccess: () => {
      queryClient.invalidateQueries(["myAlarms"]);
    },
  });

  if (status === "loading") {
    return (
      <BaseLayout>
        <LoadingRotation />
      </BaseLayout>
    );
  }

  if (status === "error") {
    console.log(error);
  }

  if (alarmActive && alarmList) {
    return (
      <BaseLayout>
        <GamePage
          alarm_id={alarmActive}
          runOnDone={() => setAlarmActive(null)}
          urgency={
            alarmList.find(({ alarm_id }) => alarm_id === alarmActive)
              ?.Difficulty ?? "low"
          }
        />
      </BaseLayout>
    );
  }

  return (
    <BaseLayout showAccount={true}>
      <Main style={{ color: "white" }}>
        <AlarmList>
          {(alarmList ?? []).map((alarm) => (
            <AlarmComponent
              key={JSON.stringify(alarm)}
              alarm={alarm}
              functionToDelete={async () =>
                deleteAlarmAndMutate(alarm.alarm_id)
              }
            />
          ))}
        </AlarmList>
        <AlarmList>
          <AlarmForm functionToAdd={addAlarmAndMutate} />
        </AlarmList>
      </Main>
    </BaseLayout>
  );
}
