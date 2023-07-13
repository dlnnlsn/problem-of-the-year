importScripts('./input_manipulation.js')

const unaryOperations = [Operation.factorial, Operation.unaryMinus, Operation.squareRoot]
const binaryOperations = [Operation.add, Operation.sub, Operation.mul, Operation.div, Operation.exponentiate]

let pruningEngine = null

onmessage = function (event) {
    pruningEngine = new PruningEngine()
    for (const startingSet of startingNumbers(event.data.year)) {
        for (const number of startingSet) {
            pruningEngine.registerNumber(number)
        }
        const solver = new Solver(startingSet)
        for (const solution of solver.solve(0, startingSet.length)) {
            if (solution.value.denominator !== 1n) continue
            const num = solution.value.numerator
            if (num <= 0n) continue
            postMessage(solution)
        }
    }
    postMessage("Done!")
}

class Solver {
    numbers
    solutionCache

    constructor(numbers) {
        this.numbers = numbers
        this.solutionCache = {}
    }

    /**
    * @param {number} startIndex
    * @param {number} endIndex
    * @returns {boolean}
    */
    sectionInCache(startIndex, endIndex) {
        if (!(startIndex in this.solutionCache)) return false
        return endIndex in this.solutionCache[startIndex]
    }

    /**
    * @param {number} startIndex
    * @param {number} endIndex
    * @returns {Iterable.<Operation>}
    */
    yieldFromCache = function* (startIndex, endIndex) {
        for (const numerator of Object.keys(this.solutionCache[startIndex][endIndex])) {
            for (const denominator of Object.keys(
                this.solutionCache[startIndex][endIndex][numerator]
            )) {
                yield this.solutionCache[startIndex][endIndex][numerator][denominator]
            }
        }
    }

    /**
    * @param {number} startIndex
    * @param {number} endIndex
    * @param {Operation} number
    * @returns {Iterable.<Operation>}
    */
    yieldNumber = function* (startIndex, endIndex, number) {
        this.solutionCache[startIndex] ||= {}
        this.solutionCache[startIndex][endIndex] ||= {}
        const {numerator, denominator} = number.value
        this.solutionCache[startIndex][endIndex][numerator] ||= {}
        this.solutionCache[startIndex][endIndex][numerator][denominator] = number
        yield number
    }

    /**
    * @param {number} startIndex
    * @param {number} endIndex
    * @param {Operation} number
    * @returns {Iterable.<Operation>}
    */
    applyUnaryOperations = function* (startIndex, endIndex, number) {
        yield* this.yieldNumber(startIndex, endIndex, number)
        for (const op of unaryOperations) {
            const res = pruningEngine.applyOperation(op, number)
            if (res === undefined) continue
            yield* this.applyUnaryOperations(startIndex, endIndex, res)
        }
    }

    /**
    * @param {number} startIndex
    * @param {number} endIndex
    * @returns {Iterable.<Operation>}
    */
    solve = function* (startIndex, endIndex) {
        if (this.sectionInCache(startIndex, endIndex)) {
            yield* this.yieldFromCache(startIndex, endIndex)
            return
        }

        if ((endIndex - startIndex) === 1)
            yield* this.applyUnaryOperations(startIndex, endIndex, this.numbers[startIndex])

        for (let i = startIndex + 1; i < endIndex; i++) {
            for (const left of this.solve(startIndex, i)) {
                for (const right of this.solve(i, endIndex)) {
                    for (const op of binaryOperations) {
                        const res = pruningEngine.applyOperation(op, left, right)
                        if (res === undefined) continue
                        yield* this.applyUnaryOperations(startIndex, endIndex, res)
                    }
                }
            }
        }
    }
}
