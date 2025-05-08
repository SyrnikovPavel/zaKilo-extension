import fs from "fs";
import path from "path";

/**
 * Load test data for a specific strategy
 * @param strategyName - The name of the strategy (e.g., 'auchan')
 * @param cardName - The name of the card file without extension (e.g., 'card1')
 * @returns The test data from the JSON file
 */
export function loadTestCard(strategyName: string, cardName: string) {
  const filePath = path.resolve(__dirname, strategyName, `${cardName}.json`);
  const fileContent = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(fileContent);
}

/**
 * Load all test cards for a specific strategy
 * @param strategyName - The name of the strategy (e.g., 'auchan')
 * @returns An array of test data objects
 */
export function loadAllTestCards(strategyName: string) {
  const directoryPath = path.resolve(__dirname, strategyName);
  const files = fs.readdirSync(directoryPath).filter((file) => file.endsWith(".json"));

  return files.map((file) => {
    const filePath = path.resolve(directoryPath, file);
    const fileContent = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(fileContent);
  });
}
