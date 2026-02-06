// pkTimerWorker.js

import { Op } from "sequelize";
import { end_pk } from "../controller/pk_controller/Pk.controller.js";
import { redis } from "./redis.js";


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