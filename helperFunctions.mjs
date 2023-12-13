import path from "path";
import { fileURLToPath } from "url";

/**
 * Get the directory name of a module URL.
 * @param {string} moduleUrl - The URL of the module.
 * @returns {string} - The directory name of the module URL.
 */
export const getDirName = (moduleUrl) => {
  // Convert the module URL to a file path.
  const filename = fileURLToPath(moduleUrl);

  // Get the directory name from the file path.
  return path.dirname(filename);
};

// const abortIfInactive = (abortSignal, rl) => {
//   abortSignal.addEventListener(
//     "abort",
//     () => {
//       let seconds = 10; // abort if the client is inactive for this period (seconds)
//       console.clear();
//       console.log("Are you still alive?"); // notify the client

//       // countdown till aborting
//       const intervalId = setInterval(() => {
//         console.clear();
//         console.log(`Aborting in ${seconds} seconds... click to cancel !`);
//         seconds -= 1;

//         if (seconds === 0) {
//           console.log("Okay, you're dead. Over and out.");
//           process.exit(0);
//         }
//       }, 1000);

//       rl.on("line", () => {
//         clearInterval(intervalId);
//         abortSignal;
//       });
//     },
//     { once: true }
//   );
// };

// export { abortIfInactive };
