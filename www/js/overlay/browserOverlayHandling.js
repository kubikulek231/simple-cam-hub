import { fetchVideoList, splitVideoFilename, getDayAndMonthNames } from "../loaders/camFootageLoading.js";
import { loadedCameraConfList } from "../loaders/camConfLoader.js";
import { createFootageOverlay } from "./footageOverlayHandling.js";
import { resumeAllStreams, pauseAllStreams } from "../utils.js";

const ITEMS_PER_PAGE = 12;

export function handleBrowserOverlay() {
    // Handling opening and closing the browser overlay
    const browserOverlayButtons = document.querySelectorAll('.button-open-browser-overlay');
    browserOverlayButtons.forEach(button => {
        button.addEventListener('click', async (event) => {
            const cameraID = event.target.parentNode.parentNode.getAttribute("camera-id");
            const currentCamConf = loadedCameraConfList[cameraID];
            const browserOverlay = await createBrowserOverlay(currentCamConf, ITEMS_PER_PAGE, 1);
            document.body.appendChild(browserOverlay);
            document.body.classList.add('overlay-open');
            pauseAllStreams();
        });
    });
}

async function createBrowserOverlay(cameraConf, itemsPerPage, pageNum) {
    // Fetch and process video list
    const videoList = await fetchVideoList(cameraConf.footageDirectory);
    const loadedVideoList = videoList.reverse();
    const pageTotalNum = Math.ceil(videoList.length / itemsPerPage);
    let videoListPaginated = paginateItems(loadedVideoList, itemsPerPage, pageNum);

    // Create UI elements
    let browserTable = createBrowserTable(pageNum, videoListPaginated, cameraConf);
    const browserHeader = createBrowserHeader();
    let browserFooter = createBrowserFooter(pageNum, pageTotalNum);
    const browserDescriptor = createBrowserDescriptor(cameraConf);

    // Create overlay
    const browserOverlay = document.createElement("div");
    browserOverlay.id = "browserOverlay";
    browserOverlay.classList.add("overlay-window");
    browserOverlay.append(browserHeader, browserDescriptor, browserTable, browserFooter);

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
        videoListPaginated = paginateItems(loadedVideoList, itemsPerPage, pageNum);
        console.log("pageNum", pageNum);
        const newBrowserTable = createBrowserTable(pageNum, videoListPaginated, cameraConf);
        const newBrowserFooter = createBrowserFooter(pageNum, pageTotalNum);

        browserOverlay.replaceChild(newBrowserTable, browserTable);
        browserOverlay.replaceChild(newBrowserFooter, browserFooter);
        browserTable = newBrowserTable;
        browserFooter = newBrowserFooter;
    });

    return browserOverlay;
}


function getCurrentDateTimeInWords() {
    const now = new Date();

    // Use Intl.DateTimeFormat with default browser locale
    const dayName = new Intl.DateTimeFormat(undefined, { weekday: 'long' }).format(now); // e.g., "Monday"
    const monthName = new Intl.DateTimeFormat(undefined, { month: 'long' }).format(now); // e.g., "October"
    const day = now.getDate(); // e.g., 6
    const year = now.getFullYear(); // e.g., 2024

    // Get time components and format them
    const hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0'); 
    
    // Construct the final string in words
    const dateInWords = `${dayName}, ${monthName} ${day}, ${year}`;

    return dateInWords + ", " + hours + ":" + minutes;
}

function paginateItems(items, itemsPerPage, pageNumber) {
    // Calculate the starting index
    const startIndex = (pageNumber - 1) * itemsPerPage;
    // Calculate the ending index
    const endIndex = startIndex + itemsPerPage;

    // Slice the items array to get the items for the requested page
    const paginatedItems = items.slice(startIndex, endIndex);

    return paginatedItems;
}

export function createBrowserTable(pageNum, paginatedVideoList, cameraConf) {
    console.log("pageNum", pageNum);
    console.log("paginatedVideoList", paginatedVideoList);
    console.log("cameraConf", cameraConf);
    const element = document.createElement("div");
    element.id = "browserTable";

    // Get the table body element
    const table = createTable();
    
    // table.setAttribute("camera-id", cameraConf.id)
    const tableBody = table.querySelector(`tbody`);

    // Populate the table with video items
    paginatedVideoList.forEach((videoPath, index) => {
        const id = index + (pageNum - 1) * ITEMS_PER_PAGE;
        const splitVideoName = splitVideoFilename(videoPath);
        const dayMonthNames = getDayAndMonthNames(
            splitVideoName.day,
            splitVideoName.month,
            splitVideoName.year
        );
        const hourString = String(splitVideoName.hour);
        const minuteString = String(splitVideoName.minute).padStart(2, "0");

        const rowData = [
            id,
            splitVideoName.year,
            dayMonthNames[0],
            splitVideoName.day + ".",
            dayMonthNames[1],
            hourString + ":" + minuteString,
        ];

        const newRow = createTableRow(rowData, videoPath, cameraConf) 
        tableBody.appendChild(newRow);
    });

    element.appendChild(tableBody);

    return element;
}

function createTableRow(rowData, videoPath, cameraConf) {
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
        createFootageOverlay(cameraConf, videoPath);
        console.log("showing footage overlay for: ", videoPath);
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
    const columns = ['ID', 'Rok', 'Den v týdnu', 'Den', 'Měsíc', 'Čas', 'Spustit'];
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
    container.classList.add('browser-overlay');

    // Create the previous page button
    const prevButton = document.createElement('button');
    prevButton.id = 'browserPagePrev';
    prevButton.classList.add('button');
    prevButton.textContent = '◀ PŘED. STRANA';

    // Create the page number container
    const pageNumContainer = document.createElement('div');
    pageNumContainer.id = 'browserPageNum';
    pageNumContainer.classList.add('browser-overlay');
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
    headerContainer.classList.add('browser-overlay');

    // Create the title div
    const titleDiv = document.createElement('div');
    titleDiv.id = 'browserOverlayTitle';
    titleDiv.classList.add('browser-overlay');
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
    descriptorContainer.classList.add('browser-overlay');

    // Create the descriptor div
    const descriptorDiv = document.createElement('div');
    descriptorDiv.id = 'browserOverlayDescriptor';
    descriptorDiv.classList.add('browser-overlay');

    // Create the date-time div
    const dateTimeDiv = document.createElement('div');
    dateTimeDiv.id = 'browserOverlayDateTime';
    dateTimeDiv.classList.add('browser-overlay');

    // Create another flex-spacer div
    const flexSpacer2 = document.createElement('div');
    flexSpacer2.classList.add('flex-spacer');

    // Append the descriptor info
    // Set description
    descriptorDiv.textContent = "Vybraná kamera: " + cameraConf.title;

    // Function to update the current date and time every second
    function updateDateTime() {
        dateTimeDiv.textContent = "Dnes je: " + getCurrentDateTimeInWords();
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