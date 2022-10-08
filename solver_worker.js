importScripts('./input_manipulation.js')

onmessage = function (event) {
    for (const startingSet of startingNumbers(event.data.year)) {
        for (const solution of findSolutions(startingSet)) {

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
    console.log(numbers)
    if (numbers.length === 1) {
        for (const op of unaryOperations) {
            const res = op(numbers[0])
            if (res === undefined) continue
            yield res
        }
        yield numbers[0]
        return
    }

    for (let i = 0; i < numbers.length; i++) {
        for (const op of unaryOperations) {
            const res = op(numbers[i])
            if (res === undefined) continue
            yield* findSolutions(
                numbers.slice(0, i).concat([res]).concat(numbers.slice(i + 1))
            )
        }
    } 

    for (let i = 0; i < numbers.length - 1; i++) {
        for (const op of binaryOperations) {
            const res = op(numbers[i], numbers[i + 1])
            if (res === undefined) continue
            yield* findSolutions(
                numbers.slice(0, i).concat([res]).concat(numbers.slice(i + 2))
            )
        }
    }
}
