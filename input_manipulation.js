importScripts('./operations.js')

/**
* @param {string} year
* @returns {Iterable.<Array<string>>}
*/
function* partitions(year) {
    if (year === '') {
        yield []
        return
    }
    for (let breakPoint = 0; breakPoint < year.length; breakPoint++) {
        const last = year.substring(breakPoint)
        for (const start of partitions(year.substring(0, breakPoint))) {
            yield start.concat([[last, breakPoint, year.length]])
        }
    }
}

/**
* @param {string} piece
* @returns {Iterable.<Operation>}
*/
function* optionsForPiece(part) {
    const [piece, startIndex, endIndex] = part
    if (piece === '0') {
        const value = Operation.number(piece)
        value.startIndex = startIndex
        value.endIndex = endIndex
        yield value
        return
    }
    if (piece[0] === '0') {
        const value = Operation.number('0.' + piece.substring(1))
        value.startIndex = startIndex
        value.endIndex = endIndex
        yield value
        return
    }
    for (let decimalIndex = 1; decimalIndex < piece.length; decimalIndex++) {
        const value = Operation.number(
            piece.substring(0, decimalIndex) + '.' + piece.substring(decimalIndex)
        )
        value.startIndex = startIndex
        value.endIndex = endIndex
        yield value
    }
    const value = Operation.number(piece)
    value.startIndex = startIndex
    value.endIndex = endIndex
    yield value
}

/**
* @param {Array<string>} partition
* @returns {Iterable.<Array<Operation>>}
*/
function* optionsForPartition(partition) {
    if (partition.length === 0) {
        yield []
        return
    }
    const last = partition.pop()
    for (const start of optionsForPartition(partition)) {
        for (const pieceOption of optionsForPiece(last)) {
            yield start.concat([pieceOption])
        }
    }
}

/**
* @param {string} year
* @returns {Iterable.<Array<Operation>>}
*/
function* startingNumbers(year) {
    for (const partition of partitions(year)) {
        for (const startingSet of optionsForPartition(partition)) {
            console.log(startingSet)
            yield startingSet
        }
    }
}
