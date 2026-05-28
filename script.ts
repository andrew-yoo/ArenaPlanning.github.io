let results = 0;
var y: number;
var z: number;
// Function to fetch the CSV and process the data
async function fetchCSV(): Promise<Record<string, string[]>> {
  const response = await fetch('./schedule.csv');
  const csvData = await response.text();

  const rows = csvData.trim().split('\n').map(row => row.split(','));


  const classData: Record<string, string[]> = {};
  rows.forEach(row => {
    const classCode = row[0]?.trim();
    if (!classCode || classCode === 'ID') {
      return;
    }

    const blocks = row[1]?.trim() ?? '';
    const periods = blocks
      ? blocks.split(';').map(period => period.trim()).filter(Boolean)
      : [];
    classData[classCode] = periods;
  });

  return classData;
}





// Function to generate all possible schedules
async function generateSchedules(): Promise<void> {
  results = 0;
  const output = document.getElementById('output') as HTMLElement;
  output.textContent = "generating...";                  
  let divb = document.querySelector(".bigdiv");
  if (divb) {
    divb.remove();
  }
  try {
    const classData = await fetchCSV();

    const selectedClasses = Array.from(document.querySelectorAll<HTMLInputElement>('input[name="class"]:checked'))
                                  .map(input => input.value);
    // Allow any number of selected classes between 0 and 8.
    if (selectedClasses.length > 8) {
      output.textContent = `You selected ${selectedClasses.length} classes; the schedule has only 8 blocks. Please select at most 8 classes.`;
      return;
    }

    const missingSelections = Array.from(new Set(
      selectedClasses.filter(classCode => !(classCode in classData))
    ));
    if (missingSelections.length > 0) {
      const message = `ERROR: ${missingSelections.join(', ')} not found in schedule.csv. Submit an issue at https://github.com/ArenaPlanning/ArenaPlanning.github.io/issues.`;
      output.textContent = message;
      throw new Error(message);
    }

    // If fewer than 8 classes selected, pad with the "Free Any" code (8) to fill all blocks.
    while (selectedClasses.length < 8) {
      selectedClasses.push("8");
    }
    const schedules = generateClassSchedules(selectedClasses, classData);

    displaySchedules(schedules, classData);
  } catch (error) {
    const message = error instanceof Error
      ? error.message
      : 'Unexpected error while generating schedules.';
    output.textContent = message;
    throw error;
  }
}





// Function to generate all possible combinations (permutations) of class schedules
function generateClassSchedules(selectedClasses: string[], classData: Record<string, string[]>): string[][] {
  let schedules: string[][] = [];
  const permutedClasses = permutator(selectedClasses);

  // Deduplicate permutations (handle repeated elements such as padded free-block placeholders)
  const seen = new Set<string>();
  const uniquePermuted: string[][] = [];
  for (const p of permutedClasses) {
    const key = p.join('|');
    if (!seen.has(key)) {
      seen.add(key);
      uniquePermuted.push(p);
    }
  }

  // Validate each unique permutation
  for (let x = 0; x < uniquePermuted.length; x++) {
    if (check(uniquePermuted, classData, x)) {
      schedules.push(uniquePermuted[x]);
    }
  }

  return schedules;
}






// Function to display the generated schedules in HTML
function displaySchedules(schedules: string[][], classData: Record<string, string[]>): void {
  const output = document.getElementById('output') as HTMLElement;
  output.innerHTML = '';

  const leat = ["A", "B", "C", "D", "E", "F", "G", "H"];
  output.textContent = ' ';
  if (schedules.length === 0) {
    output.textContent = 'No possible schedules found.';

  }

  const bigdiv = document.createElement("div");
  (bigdiv as unknown as { classList: string }).classList = "bigdiv";
  bigdiv.style.display = "flex";
  document.body.appendChild(bigdiv);
  bigdiv.style.flexDirection = "row";
  bigdiv.style.flexWrap="wrap";

  // Remove exact duplicate schedules (if any) to avoid repeated output
  const seenSchedules = new Set<string>();
  const uniqueSchedules: string[][] = [];
  for (const s of schedules) {
    const key = s.join('|');
    if (!seenSchedules.has(key)) {
      seenSchedules.add(key);
      uniqueSchedules.push(s);
    }
  }
  schedules = uniqueSchedules;

  for (let i = 0; i < schedules.length; i++) {
    const schedule = schedules[i];
    const h = i + 1;
    const newbox = document.createElement("div");
    const newpre = document.createElement("pre");

    const heder = document.createElement("strong");
    results++;
    (newpre as unknown as { classList: string }).classList = "resultspre";
    (newbox as unknown as { classList: string }).classList = "results";
    newbox.id = "box:" + results;
    newpre.id = "pre:" + results;
    newbox.style.padding = "10px"
    bigdiv.appendChild(newbox);
    newbox.appendChild(heder);
    newbox.appendChild(newpre);

    heder.textContent = "Option " + h + ": ";
    for (let j = 0; j < 8; j++) {
      newpre.textContent = newpre.textContent + leat[j] + ": " + getCheckboxLabelByValue(schedule[j]) + "\n";
    }
  }
  
}

// arraysEqual function to compare two arrays
function arraysEqual<T>(arr1: T[], arr2: T[]): boolean {
  if (arr1.length !== arr2.length) return false;
  return arr1.every((value, index) => value === arr2[index]);
}

// function for finding id from value
function getCheckboxLabelByValue(value: string): string {
  const checkbox = Array.from(document.querySelectorAll<HTMLInputElement>('input[type=checkbox][name="class"]'))
    .find(checkbox => checkbox.value === value);

  if (checkbox?.labels?.length) {
    const labelText = checkbox.labels[0].textContent?.trim();
    if (labelText) {
      return labelText;
    }
  }

  if (checkbox?.id) {
    return checkbox.id;
  }

  const freeLabels: Record<string, string> = {
    "0": "Free A/Career Center",
    "1": "Free B",
    "2": "Free C",
    "3": "Free D",
    "4": "Free E",
    "5": "Free F",
    "6": "Free G",
    "7": "Free H/Sport",
    "8": "Free Any",
  };

  return freeLabels[value] ?? value;
}




// Function to generate the next lexicographical permutation of an array
function nextPermutation(arr: string[]): string[] {
  let i = arr.length - 2;

  // Step 1: Find the first element that is smaller than the element to its right
  while (i >= 0 && arr[i] >= arr[i + 1]) {
    i--;
  }

  if (i >= 0) {
    // Step 2: Find the next largest element to swap with
    let j = arr.length - 1;
    while (arr[j] <= arr[i]) {
      j--;
    }
    // Step 3: Swap elements at i and j
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }

  // Step 4: Reverse the subarray after index i
  let left = i + 1, right = arr.length - 1;
  while (left < right) {
    [arr[left], arr[right]] = [arr[right], arr[left]];
    left++;
    right--;
  }

  return arr;
}




// Checks to see if the selected classes are in valid periods
function check(selectedClasses: string[][], classData: Record<string, string[]>, place: number): boolean {
  const letters = ["A", "B", "C", "D", "E", "F", "G", "H"];
 
  for (let i = 0; i < selectedClasses[place].length; i++) {
    const classCode = selectedClasses[place];
    const period = letters[i];
    
    // Check if the current class is available in the current period
    if (!classData[classCode[i]].includes(period)) {
      return false; // Conflict found
    }
  }
  return true; // No conflicts
}
  
  function permutator<T>(inputArr: T[]): T[][] {
  var results: T[][] = [];

  function permute(arr: T[], memo?: T[]): T[][] {
    var cur: T[];
    memo = memo || [];

    for (var i = 0; i < arr.length; i++) {
      cur = arr.splice(i, 1);
      if (arr.length === 0) {
        results.push(memo.concat(cur));
      }
      permute(arr.slice(), memo.concat(cur));
      arr.splice(i, 0, cur[0]);
    }

    return results;
  }

  return permute(inputArr);
}




document.querySelectorAll('fieldset').forEach(function(fieldset) {
  fieldset.addEventListener('click', function() {
    this.classList.toggle('active'); 
  });
});

function listiners(): void {
  const checkboxes = document.querySelectorAll('input');
  checkboxes.forEach(boxes => {
    boxes.addEventListener("change",counter);
  });
  
}
function counter(): void {
  const selectedClasses = Array.from(document.querySelectorAll<HTMLInputElement>('input[name="class"]:checked')).map(input => input.id);
  const counter = document.getElementById("counter") as HTMLElement;
  counter.textContent = selectedClasses.length as unknown as string;
  makeselected(selectedClasses);
}
listiners();

function makeselected(selectedClasses: string[]): void {
  const container = document.getElementById("selectedclasses") as HTMLElement;
  container.innerHTML = '';
  let i = 0;
  selectedClasses.forEach(() => {
  const p = document.createElement("p");
  p.textContent = selectedClasses[i];
  p.className = "selclass";
  container.appendChild(p);
  i++;
  });
}
counter();
