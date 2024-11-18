$(document).ready(function () {
    let handles = [];

    // Function to add a new input field for handles
    $("#add-handle").click(function () {
        let newInput = `
            <div class="row mb-2">
                <div class="col">
                    <input type="text" class="form-control" placeholder="Enter Codeforces handle" />
                </div>
                <div class="col-auto">
                    <button class="btn btn-danger remove-handle">Remove</button>
                </div>
            </div>`;
        $("#handle-section").append(newInput);
    });

    // Function to remove an input field
    $(document).on("click", ".remove-handle", function () {
        $(this).closest(".row").remove();
    });

    // Function to fetch problems
    $("#get-problems").click(async function () {
        handles = [];
        $("#problem-lists").html(""); // Clear previous problems

        // Collect all handles
        $("#handle-section input").each(function () {
            const handle = $(this).val().trim();
            if (handle) handles.push(handle);
        });

        if (handles.length === 0) {
            alert("Please add at least one handle.");
            return;
        }

        // Get the number of problems from input and ensure it's between 1 and 100
        let problemCount = parseInt($("#problem-count").val()) || 10;
        problemCount = Math.min(Math.max(problemCount, 1), 100);

        try {
            // Fetch solved problems for all handles
            const solvedProblems = new Set();
            for (const handle of handles) {
                const userStatus = await fetch(`https://codeforces.com/api/user.status?handle=${handle}`);
                const data = await userStatus.json();
                if (data.status === "OK") {
                    data.result.forEach((submission) => {
                        if (submission.verdict === "OK") {
                            solvedProblems.add(submission.problem.contestId + "-" + submission.problem.index);
                        }
                    });
                }
            }

            // Fetch all problems
            const problemSet = await fetch("https://codeforces.com/api/problemset.problems");
            const problemData = await problemSet.json();
            if (problemData.status === "OK") {
                const problemsByRating = {};
                problemData.result.problems.forEach((problem) => {
                    const problemKey = problem.contestId + "-" + problem.index;
                    if (!solvedProblems.has(problemKey)) {
                        const rating = problem.rating || "Unrated";
                        if (!problemsByRating[rating]) problemsByRating[rating] = [];
                        problemsByRating[rating].push(problem);
                    }
                });

                // Render problems by rating
                renderProblemsByRating(problemsByRating, problemCount);
            }
        } catch (error) {
            console.error(error);
            alert("An error occurred. Please try again.");
        }
    });

    // Function to render problems
    function renderProblemsByRating(problemsByRating, problemCount) {
        for (const rating in problemsByRating) {
            const problemList = getRandomElements(problemsByRating[rating], problemCount);
            const problemHtml = problemList
                .map(
                    (p) => `
                    <div class="d-flex justify-content-between align-items-center border-bottom py-2">
                        <a href="https://codeforces.com/problemset/problem/${p.contestId}/${p.index}" target="_blank" class="text-primary text-decoration-none">
                            ${p.name}
                        </a>
                    </div>`
                )
                .join("");

            const collapsible = `
                <div class="accordion-item">
                    <h2 class="accordion-header">
                        <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#rating-${rating}">
                            Rating: ${rating}
                        </button>
                    </h2>
                    <div id="rating-${rating}" class="accordion-collapse collapse">
                        <div class="accordion-body">
                            ${problemHtml}
                        </div>
                    </div>
                </div>`;
            $("#problem-lists").append(collapsible);
        }
    }

    // Function to get random elements from an array
    function getRandomElements(array, count) {
        const shuffled = array.slice();
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled.slice(0, count);
    }
});
