const resultsContainer = document.getElementById('results')
const statusLabel = document.getElementById('status')
const results = []

const worker = new Worker('./solver_worker.js')

function solve(digits) {
    return new Promise((resolve) => {
        const solutions = new Set()
        let maxRange = 0;
        worker.onmessage = function(event) {
            if (event.data === "Done!") {
                resolve(maxRange)
                return
            }
            const solution = event.data
            const value = Number(solution.value.numerator)
            if (value === Infinity) return
            solutions.add(value)
            while (solutions.has(maxRange + 1)) maxRange++;
        }
        worker.postMessage({ year: digits })
        statusLabel.innerHTML = `Finding solutions for ${digits}`
    })
}

async function findSolutions() {
    for (let number = 0; number < 10000; number++) {
        const digits = number.toString().padStart(4, '0')
        const range = await solve(digits)
        const element = document.createElement('li')
        element.innerText = `${digits} yields results up to ${range}`
        results.push({ element, range })
        results.sort((left, right) => right.range - left.range)
        resultsContainer.replaceChildren(...results.map(item => item.element))
    }
}

findSolutions()
