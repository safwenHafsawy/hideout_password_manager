import path from "path";
import { fileURLToPath } from "url";

/**
 *
 * @param {String} moduleUrl
 * @returns the root directory of the the current module
 */
export const getDirName = function (moduleUrl) {
  const filename = fileURLToPath(moduleUrl);

  return path.dirname(filename);
};

const abortIfInactive = (abortSignal, rl) => {
  abortSignal.addEventListener(
    "abort",
    () => {
      let seconds = 10; // abort if the client is inactive for this period (seconds)
      console.clear();
      console.log("Are you still alive?"); // notify the client

      // countdown till aborting
      const intervalId = setInterval(() => {
        console.clear();
        console.log(`Aborting in ${seconds} seconds... click to cancel !`);
        seconds -= 1;

        if (seconds === 0) {
          console.log("Okay, you're dead. Over and out.");
          process.exit(0);
        }
      }, 1000);

      rl.on("line", () => {
        clearInterval(intervalId);
        abortSignal;
      });
    },
    { once: true }
  );
};

export { abortIfInactive };
