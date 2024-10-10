export function getVideoList(directoryUrl, extension = ".mp4") {
    return new Promise((resolve, reject) => {
        fetch(directoryUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.text();
            })
            .then(text => {
                // Create a DOM parser to parse the HTML response
                const parser = new DOMParser();
                const doc = parser.parseFromString(text, 'text/html');

                // Find all anchor <a> elements (assuming they list the file names)
                const links = doc.querySelectorAll('a');
                const videoList = [];

                // Loop through each anchor tag and get the href value if it ends with .mkv
                links.forEach(link => {
                    const fileName = link.getAttribute('href');
                    if (fileName && fileName.endsWith(extension)) {
                        videoList.push(fileName);
                    }
                });

                // Resolve the promise with the video list
                resolve(videoList);
            })
            .catch(error => {
                console.error('Error fetching the directory:', error);
                // Reject the promise in case of an error
                reject(error);
            });
    });
}

export function splitVideoFilename(filename) {

    // Footage in format: 2024-09-29_02-24-56.ext

    // Remove the file extension (.mkv)
    const nameWithoutExtension = filename.replace('.mkv', '');

    // Split the date and time by the underscore
    const [datePart, timePart] = nameWithoutExtension.split('_');

    // Split the date part into year, month, day
    const [year, month, day] = datePart.split('-').map(Number); // Convert to integers

    // Split the time part into hour, minute, second
    const [hour, minute, second] = timePart.split('-').map(Number); // Convert to integers

    // Return an object containing the extracted parts as integers
    return {
        year: year,
        month: month,
        day: day,
        hour: hour,
        minute: minute,
        second: second
    };
}

export function getDayAndMonthNames(day, month, year = new Date().getFullYear()) {
    // Create a date object using the provided day, month, and year
    const date = new Date(year, month - 1, day); // month is zero-based

    // Create an instance of Intl.DateTimeFormat with the user's locale
    const optionsDay = { weekday: 'long' }; // Full name of the day
    const optionsMonth = { month: 'long' }; // Full name of the month

    // Get the day name
    const dayFormatter = new Intl.DateTimeFormat(navigator.language, optionsDay);
    const dayName = dayFormatter.format(date);

    // Get the month name
    const monthFormatter = new Intl.DateTimeFormat(navigator.language, optionsMonth);
    const monthName = monthFormatter.format(date);

    // Return the day and month names as an array
    return [dayName, monthName];
}