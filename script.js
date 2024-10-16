document.getElementById('taskForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const productStatusId = document.getElementById('productStatusId').value.trim();
    const errorDiv = document.getElementById('error');
    errorDiv.textContent = '';

    // Validate the input
    if (!validateInput(productStatusId)) return;

    // Proceed with API requests
    processTasks(productStatusId);
});

function validateInput(productStatusId)
{
    try {
        // Requirement 2
        if (!productStatusId) { // If textbox is empty
            throw new Error('Product Status ID is blank.'); // Throw and inform user of error reason
        }

        // Requirement 3
        if (!Number.isInteger(Number(productStatusId))) { // If entered value is not an integer
            throw new Error('Product Status ID must be an integer.'); // Throw and inform user of error reason
        }
    } catch (error) {
        // Display provided error message
        console.error('Error: ', error);
        alert(`An error occurred: ${error.message}`);
        // Input is invalid
        return false;
    }

    // Input is valid
    return true;
}

async function processTasks(productStatusId) {
    const apiKey = '11b910a73f0dd2c2eef2b03c2e20a3ee';

    try {
        // Format url using API key and product status ID
        const urlStatus = `https://demonstration.swiftcase.co.uk/api/v2/${apiKey}/status/${productStatusId}.json`;

        // Requirement 6
        // Make first API call and wait for response
        const response = await fetch(urlStatus, { method: "GET" });

        if (!response.ok) { // If the response is not ok
            throw new Error(`Failed to fetch task IDs. Status: ${response.status}`); // Throw and inform user of error reason
        }

        // Parse the JSON from the response
        const taskIdsData = await response.json();

        // Retrieve task IDs from the first response
        const taskIds = taskIdsData.task_ids.map(task => task.id);

        if (taskIds.length === 0) { // If no task IDs were found
            throw new Error('No tasks found for the given Product Status ID.'); // Throw and inform user of error reason
        }

        // Requirement 7
        const tasksDetails = [];
        for (let id of taskIds) { // For each task ID
            // Format url using API key and task ID
            const urlTask = `https://demonstration.swiftcase.co.uk/api/v2/${apiKey}/task/${id}.json`;
            // Make second API call and wait for response
            const taskDetailResponse = await fetch(urlTask, { method: "GET" });

            if (!taskDetailResponse.ok) { // If the response is not ok
                throw new Error(`Failed to fetch details for task ID ${id}.`); // Throw and inform user of error reason
            }

            // Parse the JSON from the response
            const taskDetail = await taskDetailResponse.json();

            //Requirement 8
            // Add data from this task to array of task data
            tasksDetails.push(taskDetail);
        }

        // Requirement 9
        let totalCost = 0;
        tasksDetails.forEach(task => { // For each task
            if (task.data[2].value == 'No') { // If this task's "Cancelled" value is "No"
                totalCost += parseFloat(task.data[0].value); // Add current task cost to total cost
            }
        });

        // Requirement 10
        // Format total cost for display
        const formattedCost = `£${totalCost.toFixed(2)}`;

        // Requirement 11
        tasksDetails.forEach(task => { // For each task
            task.data.forEach(field => { // For each data field
                if (field.name.toLowerCase().includes('date')) { // If the data field name contains "date"
                    const dateValue = new Date(field.value); // Create a date value using the data field value
                    if (!isNaN(dateValue)) { // If date value is valid
                        field.value = Math.floor(dateValue.getTime() / 1000); // Convert to Unix timestamp
                    }
                }
            });
        });

        // Order data for output
        const outputData = {
            totalCost: formattedCost,
            tasks: tasksDetails
        };

        // Requirement 12 option b
        displayModal(JSON.stringify(outputData, null, 2));

    } catch (error) {
        // Display provided error message
        console.error('Error: ', error);
        alert(`An error occurred: ${error.message}`);
    }
}

function displayModal(content) {
    const modal = document.getElementById('dataModal');
    const totalCostElement = document.getElementById('totalCost');
    const taskTableBody = document.getElementById('taskTable').querySelector('tbody');
    const buttonClose = document.querySelector('.button-close');

    // Parse the JSON from the output data
    const data = JSON.parse(content);

    // Display total cost
    totalCostElement.textContent = `Total Cost: ${data.totalCost}`;

    // Clear any previous task rows from previous tables
    taskTableBody.innerHTML = '';

    // Populate task data in the table
    data.tasks.forEach(task => {
        // Extract each piece of data for each field in table
        const productName = task.data.find(item => item.name === 'product_name')?.value || 'N/A';
        const cost = task.data.find(item => item.name === 'cost')?.value || 'N/A';
        const formattedCost = `£${Number(cost).toFixed(2)}`;
        const dateOrdered = task.data.find(item => item.name === 'date_ordered')?.value || 'N/A';
        const cancelled = task.data.find(item => item.name === 'cancelled')?.value || 'N/A';
        const status = task.status?.status || 'N/A';
        
        // Format task users into a string for clearer visual display
        const taskUsers = task.taskUsers.map(user => `${user.user.name} (${user.relationship})`).join('<br>');

        // Create a new row in the table with this task ID's data
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${task.id}</td>
            <td>${productName}</td>
            <td>${formattedCost}</td>
            <td>${new Date(dateOrdered * 1000).toLocaleDateString()}</td>
            <td>${cancelled}</td>
            <td>${status}</td>
            <td>${taskUsers}</td>
        `;

        // Append the row to the table
        taskTableBody.appendChild(row);
    });

    // Show the modal
    modal.style.display = 'block';

    // Requirement 14
    // Hide modal when the user clicks the close button
    buttonClose.onclick = function() {
        modal.style.display = 'none';
        taskTableBody.innerHTML = '';
    };

    // Hide modal when the user clicks outside of it
    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    };
}
