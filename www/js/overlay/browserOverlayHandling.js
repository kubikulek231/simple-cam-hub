import { fetchVideoList, splitVideoFilename, getDayAndMonthNames, getStartTimestampFromSplitVideoName, groupItemsByDaysAgo } from "../loaders/camFootageLoading.js";
import { loadedCameraConfList } from "../loaders/camConfLoader.js";
import { createFootageOverlay } from "./footageOverlayHandling.js";
import { resumeAllStreams, pauseAllStreams } from "../utils.js";
import { getCurrentDateTimeInWords } from "../utils.js";
import { loadedCameraFootageInfo, loadedCameraFootageInfoStatus } from "../loaders/camFootageInfoLoader.js";

export function handleBrowserOverlay() {
    // Handling opening and closing the browser overlay
    const browserOverlayButtons = document.querySelectorAll('.button-open-browser-overlay');
    browserOverlayButtons.forEach(button => {
        button.addEventListener('click', async (event) => {
            const cameraID = event.target.parentNode.parentNode.getAttribute("camera-id");
            const currentCamConf = loadedCameraConfList[cameraID];
            const browserOverlay = await createBrowserOverlay(currentCamConf, 1);
            document.body.appendChild(browserOverlay);
            document.body.classList.add('overlay-open');
            pauseAllStreams();
        });
    });
}

async function createBrowserOverlay(cameraConf, pageNum) {
    // Fetch and process video list
    const videoList = loadedCameraFootageInfo[cameraConf.id];
    const loadedVideoList = videoList;
    let videoListGroupedByDaysAgo = groupItemsByDaysAgo(loadedVideoList);
    const pageTotalNum = Object.keys(videoListGroupedByDaysAgo).length;
    
    // Create UI elements
    let browserTable = createBrowserTable(pageNum, videoListGroupedByDaysAgo, cameraConf);
    const browserHeader = createBrowserHeader();
    browserHeader.classList.add("overlay-item");
    let browserFooter = createBrowserFooter(pageNum, pageTotalNum);
    const browserDescriptor = createBrowserDescriptor(cameraConf);
    browserDescriptor.classList.add("overlay-item");

    const topSpacer = document.createElement("div");
    topSpacer.classList.add("overlay-vertical-spacer");
    const botSpacer = document.createElement("div");
    botSpacer.classList.add("overlay-vertical-spacer");

    const footerSpacer = document.createElement("div");
    footerSpacer.classList.add("flex-spacer");

    // Create overlay
    const browserOverlay = document.createElement("div");
    browserOverlay.id = "browserOverlay";
    browserOverlay.classList.add("overlay-window");
    browserOverlay.append(topSpacer, browserHeader, browserDescriptor, browserTable, browserFooter, botSpacer, footerSpacer);

    // Add event delegation for button clicks
    browserOverlay.addEventListener("click", (event) => {
        if (event.target.id === "exitBrowserOverlayButton") {
            browserOverlay.remove();
            document.body.classList.remove('overlay-open');
            resumeAllStreams();
            return;
        } 
        
        if (event.target.id === "browserPagePrev" && pageNum > 1) {
            pageNum -= 1;
        } else if (event.target.id === "browserPageNext" && pageNum < pageTotalNum) {
            pageNum += 1;
        } else {
            return;
        }
        
        // Recalculate paginated list and update table/footer
        const newBrowserTable = createBrowserTable(pageNum, videoListGroupedByDaysAgo, cameraConf);
        const newBrowserFooter = createBrowserFooter(pageNum, pageTotalNum);

        browserOverlay.replaceChild(newBrowserTable, browserTable);
        browserOverlay.replaceChild(newBrowserFooter, browserFooter);
        browserTable = newBrowserTable;
        browserFooter = newBrowserFooter;
    });

    return browserOverlay;
}

function createBrowserTable(pageNum, videoListGroupedByDaysAgo, cameraConf) {
    const element = document.createElement("div");
    element.id = "browserTable";

    // Get the table body element
    const table = createTable();
    
    // table.setAttribute("camera-id", cameraConf.id)
    const tableBody = table.querySelector(`tbody`);

    // Populate the table with video items
    videoListGroupedByDaysAgo[pageNum - 1].forEach((videoInfoEntry, index) => {
        console.log(videoInfoEntry);
        const id = index;
        const splitVideoName = splitVideoFilename(videoInfoEntry.file);
        const dayMonthNames = getDayAndMonthNames(
            splitVideoName.day,
            splitVideoName.month,
            splitVideoName.year
        );
        const hourString = String(splitVideoName.hour);
        const minuteString = String(splitVideoName.minute).padStart(2, "0");
        const isVideoValid = evaluateVideoStatus(videoInfoEntry, splitVideoName, 0.9);

        let validStatus = isVideoValid ? "OK" : "X";

        const rowData = [
            id,
            splitVideoName.year,
            dayMonthNames[0],
            splitVideoName.day + ".",
            dayMonthNames[1],
            hourString + ":" + minuteString,
            id === 0 && pageNum === 1 ? "REC" : validStatus,
        ];

        const newRow = createTableRow(rowData, videoInfoEntry, cameraConf) 
        tableBody.appendChild(newRow);
    });

    element.appendChild(table);
    return element;
}

function createTableRow(rowData, videoInfoEntry, cameraConf) {
    // Create a new table row
    const newRow = document.createElement("tr");

    // Loop through the rowData array and create cells for each value
    rowData.forEach(data => {
        const newCell = newRow.insertCell();
        const textNode = document.createTextNode(data);
        newCell.appendChild(textNode);
    });

    // Create the button element
    const button = document.createElement("button");
    button.classList.add("button", "button-play");  // Use classList.add to add multiple classes
    button.textContent = "▶";

    button.addEventListener("click", function() {
        createFootageOverlay(cameraConf, videoInfoEntry.file);
    });

    // Create a new cell and append the button to it
    const buttonCell = newRow.insertCell();
    buttonCell.appendChild(button);
    return newRow;
}

function createTable() {
    const table = document.createElement('table');
    table.id = 'browserTable';
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    const columns = ['ID', 'Rok', 'Den v týdnu', 'Den', 'Měsíc', 'Čas', 'Stav', 'Spustit'];
    // Loop through columns to create th elements
    columns.forEach(column => {
        const th = document.createElement('th');
        th.textContent = column;
        headerRow.appendChild(th);
    });
    // Append header row to the table header
    thead.appendChild(headerRow);
    const tbody = document.createElement('tbody');
    table.appendChild(thead);
    table.appendChild(tbody);
    return table;
}

// Function to create the overlay page container
function createBrowserFooter(pageNum, pageTotalNum) {
    // Create the container div
    const container = document.createElement('div');
    container.id = 'browserOverlayPageContainer';
    container.classList.add('overlay-item');

    // Create the previous page button
    const prevButton = document.createElement('button');
    prevButton.id = 'browserPagePrev';
    prevButton.classList.add('button');
    prevButton.textContent = '◀ PŘED. STRANA';

    // Create the page number container
    const pageNumContainer = document.createElement('div');
    pageNumContainer.id = 'browserPageNum';
    pageNumContainer.textContent = `Strana ${pageNum} z ${pageTotalNum}`;

    // Create the next page button
    const nextButton = document.createElement('button');
    nextButton.id = 'browserPageNext';
    nextButton.classList.add('button');
    nextButton.textContent = 'NÁSL. STRANA ▶';

    // Disable the next button if on the last page
    if (pageNum >= pageTotalNum) {
        nextButton.setAttribute("disabled", true);
    } else {
        nextButton.removeAttribute("disabled"); // Remove disabled attribute instead of setting it to false
    }

    // Disable the previous button if on the first page
    if (pageNum <= 1) {
        prevButton.setAttribute("disabled", true);
    } else {
        prevButton.removeAttribute("disabled"); // Remove disabled attribute instead of setting it to false
    }

    // Append the elements to the container
    container.appendChild(prevButton);
    container.appendChild(pageNumContainer);
    container.appendChild(nextButton);
    return container;
}

// Function to create the header container
function createBrowserHeader() {
    // Create the header container div
    const headerContainer = document.createElement('div');
    headerContainer.id = 'browserOverlayHeader';

    // Create the title div
    const titleDiv = document.createElement('div');
    titleDiv.id = 'browserOverlayTitle';
    titleDiv.textContent = '📂Prohlížeč záznamů';

    // Create the close button
    const closeButton = document.createElement('button');
    closeButton.id = 'exitBrowserOverlayButton';
    closeButton.classList.add('button', 'button-close');
    closeButton.textContent = '✖ ZAVŘÍT';

    // Create the flex-spacer div
    const flexSpacer = document.createElement('div');
    flexSpacer.classList.add('flex-spacer');

    // Append title, spacer, and button to the header container
    headerContainer.appendChild(titleDiv);
    headerContainer.appendChild(flexSpacer);
    headerContainer.appendChild(closeButton);

    // Append the header container to the body (or any other element)
    return headerContainer;
}

// Function to create the descriptor container
function createBrowserDescriptor(cameraConf) {
    // Create the descriptor container div
    const descriptorContainer = document.createElement('div');
    descriptorContainer.id = 'browserOverlayDescriptorContainer';

    // Create the descriptor div
    const descriptorDiv = document.createElement('div');
    descriptorDiv.id = 'browserOverlayDescriptor';

    // Create the date-time div
    const dateTimeDiv = document.createElement('div');
    dateTimeDiv.id = 'browserOverlayDateTime';

    // Create another flex-spacer div
    const flexSpacer2 = document.createElement('div');
    flexSpacer2.classList.add('flex-spacer');

    // Append the descriptor info
    // Set description
    descriptorDiv.textContent = "Vybraná kamera: " + cameraConf.title;

    // Function to update the current date and time every second
    function updateDateTime() {
        dateTimeDiv.textContent = "Dnes je " + getCurrentDateTimeInWords();
    }

    // Update the time every second
    setInterval(updateDateTime, 1000); // 1000 ms = 1 second
    updateDateTime(); // Initial call to display the time immediately without waiting 1 second

    // Append descriptor, spacer, and date-time to the descriptor container
    descriptorContainer.appendChild(descriptorDiv);
    descriptorContainer.appendChild(flexSpacer2);
    descriptorContainer.appendChild(dateTimeDiv);

    // Append the descriptor container to the body (or any other element)
    return descriptorContainer;
}

function evaluateVideoStatus(videoInfoEntry, splitVideoName, thresh = 0.05) {
    const startTimestamp = getStartTimestampFromSplitVideoName(splitVideoName);
    const endTimestamp = videoInfoEntry.end_time;
    const duration = videoInfoEntry.duration;
    const segmentTime = videoInfoEntry.segment_time;

    console.log("splitVideoName:", splitVideoName);
    console.log("startTimestamp: ", startTimestamp);
    console.log("endTimestamp: ", endTimestamp);
    console.log("duration: ", duration);
    console.log("segmentTime: ", segmentTime);

    // Calculate actual segment length from timestamps
    const actualSegmentLength = endTimestamp - startTimestamp;

    const tolerance = segmentTime * thresh;

    // Check if both duration and actual segment length are within tolerance of segment_time
    const durationOk = Math.abs(duration - segmentTime) <= tolerance;
    const segmentLengthOk = Math.abs(actualSegmentLength - segmentTime) <= tolerance;

    console.log("durationOk: ", durationOk);
    console.log("segmentLengthOk: ", segmentLengthOk);

    return durationOk && segmentLengthOk;
}