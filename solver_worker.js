importScripts('./input_manipulation.js')

let pruningEngine = null

onmessage = function (event) {
    pruningEngine = new PruningEngine()
    for (const startingSet of startingNumbers(event.data.year)) {
        for (const number of startingSet) {
            pruningEngine.registerNumber(number)
        }
        for (const solution of findSolutions(startingSet, 0, startingSet.length)) {
            if (solution.value.denominator !== 1n) continue
            const num = solution.value.numerator
            if (num <= 0n) continue
            postMessage(solution)
        }
    }
    postMessage("Done!")
}

const unaryOperations = [Operation.factorial, Operation.unaryMinus, Operation.squareRoot]
const binaryOperations = [Operation.add, Operation.sub, Operation.mul, Operation.div, Operation.exponentiate]

/**
* @param {Operation} number
* @returns {Iterable.<Operation>}
*/
function* applyUnaryOperations(number) {
    yield number
    for (const op of unaryOperations) {
        const res = pruningEngine.applyOperation(op, number)
        if (res === undefined) continue
        yield* applyUnaryOperations(res)
    }
}

/**
* @param {Array<Operation>} numbers
* @param {number} startIndex
* @param {endIndex} endIndex
* @returns {Iterable.<Operation>}
*/
function* findSolutions(numbers, startIndex, endIndex) {
    if ((endIndex - startIndex) === 1) yield* applyUnaryOperations(numbers[startIndex])

    for (let i = startIndex + 1; i < endIndex; i++) {
        for (const left of findSolutions(numbers, startIndex, i)) {
            for (const right of findSolutions(numbers, i, endIndex)) {
                for (const op of binaryOperations) {
                    const res = pruningEngine.applyOperation(op, left, right)
                    if (res === undefined) continue
                    yield* applyUnaryOperations(res)
                }
            }
        }
    }
}
