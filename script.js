const yearInput = document.getElementById("year")
const resultsContainer = document.getElementById("results-container")
const resultLabels = []

for (let i = 0; i < 100; ++i) {
    const label = document.createElement('span')
    resultsContainer.append(label)
    resultLabels.push(label)
}

var worker = null

function findSolutions() {
    if (worker !== null) {
        worker.terminate()
    }

    for (const label of resultLabels) {
        label.innerHTML = ""
    }

    worker = new Worker("./solver_worker.js")
    worker.onmessage = function(event) {
        const solution = event.data
        console.log(solution.value.numerator + " = " + solution.expression)
        if (solution.value.numerator <= 100n) {
            resultLabels[Number(solution.value.numerator) - 1].innerHTML = "$$" + solution.value.numerator + " = " + solution.expression + "$$"
            MathJax.typeset()
        }
    }
    worker.postMessage({ year: yearInput.value })
}
