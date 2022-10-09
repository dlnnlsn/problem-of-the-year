importScripts('./input_manipulation.js')

const bestSolutions = {}

let pruningEngine = null

onmessage = function (event) {
    pruningEngine = new PruningEngine()
    for (const startingSet of startingNumbers(event.data.year)) {
        for (const number of startingSet) {
            pruningEngine.registerNumber(number)
        }
        for (const solution of findSolutions(startingSet)) {
            if (solution.value.denominator !== 1n) continue
            const num = solution.value.numerator
            if (num <= 0n) continue
            if (num in bestSolutions) {
                if (solution.numberOfOperations >= bestSolutions[num].numberOfOperations) continue
            }
            bestSolutions[num] = solution
            postMessage(solution)
        }
    }
}

const unaryOperations = [Operation.factorial, Operation.unaryMinus, Operation.squareRoot]
const binaryOperations = [Operation.add, Operation.sub, Operation.mul, Operation.div, Operation.exponentiate]

/**
* @param {Array<Operation>} numbers
* @returns {Iterable.<Operation>}
*/
function* findSolutions(numbers) {

    for (let i = 0; i < numbers.length - 1; i++) {
        for (const op of binaryOperations) {
            const res = pruningEngine.applyOperation(op, numbers[i], numbers[i + 1])
            if (res === undefined) continue
            yield* findSolutions(
                numbers.slice(0, i).concat([res]).concat(numbers.slice(i + 2))
            )
        }
    }

    for (let i = 0; i < numbers.length; i++) {
        for (const op of unaryOperations) {
            const res = pruningEngine.applyOperation(op, numbers[i])
            if (res === undefined) continue
            yield* findSolutions(
                numbers.slice(0, i).concat([res]).concat(numbers.slice(i + 1))
            )
        }
    } 

    if (numbers.length === 1) {
        yield numbers[0]
        return
    }
}
