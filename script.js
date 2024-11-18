$(document).ready(function () {
    let handles = [];

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

    $(document).on("click", ".remove-handle", function () {
        $(this).closest(".row").remove();
    });

    $("#get-problems").click(async function () {
        handles = [];
        $("#problem-lists").html(""); 

        $("#handle-section input").each(function () {
            const handle = $(this).val().trim();
            if (handle) handles.push(handle);
        });

        if (handles.length === 0) {
            alert("Please add at least one handle.");
            return;
        }

        let problemCount = parseInt($("#problem-count").val()) || 10;
        problemCount = Math.min(Math.max(problemCount, 1), 100);

        try {
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

                renderProblemsByRating(problemsByRating, problemCount);
            }
        } catch (error) {
            console.error(error);
            alert("An error occurred. Please try again.");
        }
    });

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

    function getRandomElements(array, count) {
        const shuffled = array.slice();
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled.slice(0, count);
    }
});
