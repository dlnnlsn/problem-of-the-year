const yearInput = document.getElementById('year')
const resultsContainer = document.getElementById('results-container')
const workingStatus = document.getElementById('working-status')
const resultLabels = []

let solutions = {}
let numLabels = 100

function createLabel() {
    const label = document.createElement('div')
    label.classList.add('solution')
    resultsContainer.append(label)
    resultLabels.push(label)
}

for (let i = 0; i < 100; ++i) {
    createLabel()
}
resetLabels()

function typeset(num, expression, found = true) {
    const element = document.createElement('span')
    element.innerHTML = '$$' + num + ' = ' + expression + '$$'
    MathJax.startup.promise = MathJax.startup.promise
        .then(() => MathJax.typesetPromise([element]))
        .then(() => {
            const label = resultLabels[num - 1]
            label.replaceChildren(element)
            if (found) label.classList.add('found')
        })
}

function resetLabels() {
    workingStatus.style.display = 'none'
    MathJax.startup.output.clearCache()
    resultLabels.splice(100)
    numLabels = 100
    for (let i = 0; i < 100; i++) {
        const label = resultLabels[i];
        label.classList.remove('found')
        typeset(i + 1, '{\\color{gray}\\textit{No solution found}}', false)
    }
    resultsContainer.replaceChildren(...resultLabels)
}

var worker = null

function findSolutions() {
    if (worker !== null) {
        worker.terminate()
    }

    resetLabels()
    solutions = {}

    worker = new Worker('./solver_worker.js')
    worker.onmessage = function(event) {
        if (event.data === "Done!") {
            workingStatus.style.display = 'none'
            return;
        }

        const solution = event.data
        const value = Number(solution.value.numerator)
        if (value === Infinity) return
        solutions[value] = solution

        if (value <= numLabels) {
            typeset(value, solution.expression)
        }
        else if (value === (numLabels + 1)) {
            numLabels++
            while (numLabels in solutions) {
                createLabel()
                typeset(numLabels, solutions[numLabels].expression)
                numLabels++;
            }
            numLabels--
        }
    }
    worker.postMessage({ year: yearInput.value })
    workingStatus.style.display = 'flex'
}
