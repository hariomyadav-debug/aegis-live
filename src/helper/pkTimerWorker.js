// pkTimerWorker.js

import { Op } from "sequelize";
import { redis } from "./redis.js";
import { end_pk } from "../controller/pk_controller/PK_sockets.controller.js";

export function startPkTimerWorker({ emitToRoom, emitEvent, getRoomMembers }) {


  setInterval(async () => {
    try {
      const keys = await redis.keys("pk:timer:*");

      for (const key of keys) {
        const t = await redis.hgetall(key);
        if (!t.startTime) continue;

        const elapsed = Date.now() - Number(t.startTime);
        const remaining = Math.max(
          Math.ceil((Number(t.duration) - elapsed) / 1000),
          0
        );

        const pk_battle_id = key.split(":")[2];
        if(!pk_battle_id) continue;

        emitToRoom(t.host1_room, "pk_timer_update", {
          pk_battle_id,
          remaining
        });

        emitToRoom(t.host2_room, "pk_timer_update", {
          pk_battle_id,
          remaining
        });

        console.log({
          pk_battle_id,
          remaining
        })

        // AUTO END
        if (remaining <= 1) {
          await redis.del(key);

          console.log("pk end by timer ===========> ", { pk_battle_id, remaining })
          await end_pk(
            null,
            { pk_battle_id, remaining },
            emitEvent,
            emitToRoom,
            getRoomMembers
          );
        }
      }
    } catch (err) {
      console.error("PK Timer Worker error:", err);
    }
  }, 1000);
}


const activePkTimers = new Map(); // store interval refs

export async function startPkTimer(pk_battle_id, { emitToRoom, emitEvent, getRoomMembers }) {
 
  try {
    const key = `pk:timer:${pk_battle_id}`;

    // prevent duplicate timer
    if (activePkTimers.has(pk_battle_id)) {
      return;
    }

    const interval = setInterval(async () => {
      try {

        const t = await redis.hgetall(key);

        if (!t  ||  !t?.host1_room) {
          console.log("==========> 1", t, pk_battle_id);
          stopPkTimer(pk_battle_id);
          return;
        }
        
        const elapsed = Date.now() - Number(t.startTime);
        
        const remaining = Math.max(
          Math.ceil((Number(t.duration) - elapsed) / 1000),
          0
        );
        if(!remaining && remaining != 0) {
          console.log("==========> 2", pk_battle_id);
          stopPkTimer(pk_battle_id);
          return;
        }

        emitToRoom(t.host1_room, "pk_timer_update", {
          pk_battle_id,
          remaining
        });
        
        emitToRoom(t.host2_room, "pk_timer_update", {
          pk_battle_id,
          remaining
        });
        
        console.log("PK TIMER:", {
          pk_battle_id,
          remaining
        });


        // END PK
        if (remaining <= 1) {
          await redis.del(key);
          
          console.log("pk end by timer===== ===>", pk_battle_id);
          
          await end_pk(
            null,
            { pk_battle_id, remaining },
            emitEvent,
            emitToRoom,
            getRoomMembers
          );
          stopPkTimer(pk_battle_id);

        }

      } catch (err) {
        console.error("PK Timer Error:", err);
      }

    }, 1000);


    activePkTimers.set(pk_battle_id, interval);

  } catch (err) {
    console.error(err);
  }
}


export function stopPkTimer(pk_battle_id) {

  const interval = activePkTimers.get(pk_battle_id);

  if (interval) {

    clearInterval(interval);

    activePkTimers.delete(pk_battle_id);

    console.log("Stopped PK Timer:", pk_battle_id);

  }

}