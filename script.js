const yearInput = document.getElementById('year')
const resultsContainer = document.getElementById('results-container')
const resultLabels = []

for (let i = 0; i < 100; ++i) {
    const label = document.createElement('div')
    label.classList.add('solution')
    resultsContainer.append(label)
    resultLabels.push(label)
}

function typeset(num, expression) {
    const element = document.createElement('span')
    element.innerHTML = '$$' + num + ' = ' + expression + '$$'
    MathJax.startup.promise = MathJax.startup.promise
        .then(() => MathJax.typesetPromise([element]))
        .then(() => {
            const label = resultLabels[num - 1]
            label.replaceChildren(element)
            label.classList.add('found')
        })
}

var worker = null

function findSolutions() {
    if (worker !== null) {
        worker.terminate()
    }

    for (const label of resultLabels) {
        label.replaceChildren()
        label.classList.remove('found')
    }

    MathJax.startup.output.clearCache()

    worker = new Worker('./solver_worker.js')
    worker.onmessage = function(event) {
        const solution = event.data
        if (solution.value.numerator <= 100n) {
            const num = Number(solution.value.numerator)
            typeset(num, solution.expression)
        }
    }
    worker.postMessage({ year: yearInput.value })
}
