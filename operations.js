importScripts('./math.js')

/** @type {Array<Fraction>} */
const factorials = [new Fraction(1n, 1n)]
for (let num = 1; num <= 20; ++num) {
    factorials.push(
        Fraction.mul(factorials[num - 1], new Fraction(BigInt(num), 1n))
    )
}

/**
* @enum {number}
*/
const OperationTypes = {
    Add: 0,
    Subtract: 1,
    Multiply: 2,
    Divide: 3,
    Exponentiate: 4,
    Factorial: 5,
    UnaryMinus: 6,
    SquareRoot: 7,
    Number: 8,
}

/**
* @param {Operation} op
* @returns {boolean}
*/
function isSimpleNumber(op) {
    if (op.operationType !== OperationTypes.Number) return false
    if (op.expression.includes('.')) return op.expression[0] === '0'
    return true
}

class Operation {
    /** @type {OperationTypes} */
    operationType
    /** @type {number} */
    numberOfOperations
    /** @type {string} */
    expression
    /** @type {Fraction} */
    value
    /** @type {string} */
    digits

    /**
    * @param {OperationTypes} operationType
    * @param {number} numberOfOperations
    * @param {string} expression
    * @param {Fraction} value
    * @returns {Operation}
    */
    constructor(operationType, numberOfOperations, expression, value) {
        this.operationType = operationType
        this.numberOfOperations = numberOfOperations
        this.expression = expression
        this.value = value
    }

    /**
    * @param {Operation} left
    * @param {Operation} right
    * @returns {Operation | undefined}
    */
    static add(left, right) {
        // Prefer (a + b) + c to a + (b + c)
        if (right.operationType === OperationTypes.Add) return undefined
        // Prefer (a + b) - c to a + (b - c)
        if (right.operationType === OperationTypes.Subtract) return undefined
        return new Operation(
            OperationTypes.Add,
            left.numberOfOperations + right.numberOfOperations + 1,
            left.expression + ' + ' + right.expression,
            Fraction.add(left.value, right.value) 
        )
    }

    /**
    * @param {Operation} left
    * @param {Operation} right
    * @returns {Operation | undefined}
    */
    static sub(left, right) {
        // Prefer (a - b) - c to a - (b + c)
        if (right.operationType === OperationTypes.Add) return undefined
        // Prefer (a - b) + c to a - (b - c)
        if (right.operationType === OperationTypes.Subtract) return undefined
        // Prefer a + 0 to a - 0
        if (right.value.numerator === 0n) return undefined
        return new Operation(
            OperationTypes.Subtract,
            left.numberOfOperations + right.numberOfOperations + 1,
            left.expression + ' - ' + right.expression,
            Fraction.sub(left.value, right.value)
        )
    }

    /**
    * @param {Operation} op
    * @returns {string}
    */
    static #bracketForMultiply(op) {
        if ([OperationTypes.Add, OperationTypes.Subtract, OperationTypes.UnaryMinus].includes(op.operationType)) return "\\left(" + op.expression + "\\right)"
        return op.expression
    }

    /**
    * @param {Operation} left
    * @param {Operation} right
    * @returns {Operation | undefined}
    */
    static mul(left, right) {
        // Prefer -(a x b) to (-a) x b
        if (left.operationType === OperationTypes.UnaryMinus) return undefined
        // Prefer -(a x b) to a x (-b)
        if (right.operationType === OperationTypes.UnaryMinus) return undefined
        // Prefer (a x b) x c to a x (b x c)
        if (right.operationType === OperationTypes.Multiply) return undefined
        // Prefer (a x b) / c to a x (b / c)
        if (right.operationType === OperationTypes.Divide) return undefined
        // Prefer (number made up of digits of expression) x 0 to (complicated expression) x 0
        if (left.value.eq(0) && !isSimpleNumber(right)) return undefined
        // Prefer 0 x (number consisting of digits of expression) to 0 x (complicated expression)
        if (right.value.eq(0) && !isSimpleNumber(left)) return undefined
        // A little silly to explicitly prune this, but prefer 2 + 2 to 2 x 2 😛
        if (left.value.eq(2) && right.value.eq(2)) return undefined
        // Prefer 1 x a + b to 1 x (a + b)
        if (left.value.eq(1) && (right.operationType === OperationTypes.Add)) return undefined
        if (left.value.eq(1) && (right.operationType === OperationTypes.Subtract)) return undefined

        return new Operation(
            OperationTypes.Multiply,
            left.numberOfOperations + right.numberOfOperations + 1,
            Operation.#bracketForMultiply(left) + " \\times " + Operation.#bracketForMultiply(right),
            Fraction.mul(left.value, right.value)
        )
    }

    /**
    * @param {Operation} left
    * @param {Operation} right
    * @returns {Operation | undefined}
    */
    static div(left, right) {
        // Prefer -(a / b) to (-a) / b
        if (left.operationType === OperationTypes.UnaryMinus) return undefined
        // Prefer -(a / b) to a / (-b)
        if (right.operationType === OperationTypes.UnaryMinus) return undefined
        // Prefer a/(b x c) to (a / b) / c
        if (left.operationType === OperationTypes.Divide) return undefined
        // Prefer (a / b) x c to a / (b / c)
        if (right.operationType === OperationTypes.Divide) return undefined
        // Can not divide by 0
        if (right.value.eq(0)) return undefined
        // Prefer 0 x a to 0 / a
        if (left.value.eq(0)) return undefined
        // Prefer a x 1 to a / 1
        if (right.value.eq(1)) return undefined
        // Prefer a x (-1) to a / (-1)
        if (right.value.eq(-1)) return undefined

        return new Operation(
            OperationTypes.Divide,
            left.numberOfOperations + right.numberOfOperations + 1,
            "\\frac{" + left.expression + "}{" + right.expression + "}",
            Fraction.div(left.value, right.value)
        )
    }

    /**
    * @param {Operation} op
    * @returns {Operation | undefined}
    */
    static factorial(op) {
        // Only allow factorials of integers
        if (op.value.denominator !== 1n) return undefined
        // Only allow factorials of non-negative integers
        if (op.value.numerator < 0n) return undefined
        // Only allow small factorials
        if (op.value.numerator > 20) return undefined

        return new Operation(
            OperationTypes.Factorial,
            op.numberOfOperations + 1,
            (op.operationType === OperationTypes.Number) ? op.expression + "!" : "\\left(" + op.expression + "\\right)!",
            factorials[op.value.numerator]
        )
    }

    /**
    * @param {Operation} op
    * @returns {Operation | undefined}
    */
    static unaryMinus(op) {
        // Prefer (-a) + b to -(a - b)
        if (op.operationType === OperationTypes.Subtract) return undefined
        // Prefer (-a) - b to -(a + b)
        if (op.operationType === OperationTypes.Add) return undefined

        return new Operation(
            OperationTypes.UnaryMinus,
            op.numberOfOperations + 1,
            (op.operationType === OperationTypes.Number) ? "-" + op.expression : "-\\left(" + op.expression + "\\right)",
            Fraction.minus(op.value)
        )
    }

    /**
    * @param {Operation} op
    * @returns {Operation | undefined}
    */
    static squareRoot(op) {
        const numerator = nthRoot(op.value.numerator, 2n)
        // Numerator must be a perfect square
        if (numerator === undefined) return undefined

        const denominator = nthRoot(op.value.denominator, 2n)
        // Denominator must be a perfect square
        if (denominator === undefined) return undefined

        return new Operation(
            OperationTypes.SquareRoot,
            op.numberOfOperations + 1,
            "\\sqrt{" + op.expression + "}",
            new Fraction(numerator, denominator)
        )
    }

    /**
    * @param {Operation} left
    * @param {Operation} right
    * @returns {Operation | undefined}
    */
    static exponentiate(left, right) {
        // Prefer a^(b x c) to (a^b)^c
        if (left.operationType === OperationTypes.Exponentiate) return undefined
        // Prefer Sqrt(a^b) to Sqrt(a)^b
        if (left.operationType === OperationTypes.SquareRoot) return undefined
        // Only allow small exponents
        if ((right.value.numerator > 100n) || (right.value.numerator < -100n) ||
            (right.value.denominator > 100n) || (right.value.denominator < -100n)) {
            if (!left.value.eq(1) && !left.value.eq(-1)) return undefined
        }
        // Prefer a x 1 to a^1
        if (right.value.eq(1)) return undefined
        // Prefer 1^(number formed by digits in expression) to 1^(complicated expression)
        if (left.value.eq(1) && !isSimpleNumber(right)) return undefined
        // Prefer (number formed by digits in expression)^0 to (complicated expression)^0
        if (right.value.eq(0) && !isSimpleNumber(left)) return undefined
        // Prefer 0 x a to 0^a
        if (left.value.eq(0) && !right.value.eq(0)) return undefined

        const base = (right.value.numerator < 0n) ? left.value.reciprocal() : left.value
        const exp = (right.value.numerator < 0n) ? Fraction.minus(right.value) : right.value

        let numerator = nthRoot(base.numerator, exp.denominator)
        if (numerator === undefined) return undefined
        numerator = pow(numerator, exp.numerator)

        let denominator = nthRoot(base.denominator, exp.denominator)
        if (denominator === undefined) return undefined
        denominator = pow(denominator, exp.numerator)

        return new Operation(
            OperationTypes.Exponentiate,
            left.numberOfOperations + right.numberOfOperations + 1,
            "{" + ((left.operationType === OperationTypes.Number) ? left.expression : "\\left(" + left.expression + "\\right)") + "}^{" + right.expression + "}",
            new Fraction(numerator, denominator)
        )
    }

    /**
    * @param {string} expression
    * @returns {Operation}
    */
    static number(expression) {
        let value
        const indexOfDot = expression.indexOf('.')
        if (indexOfDot === -1) value = new Fraction(BigInt(expression), 1n)
        else {
            const wholePart = BigInt(expression.substring(0, indexOfDot))
            const fractionalPart = BigInt(expression.substring(indexOfDot + 1))
            const powerOfTen = expression.length - indexOfDot - 1
            const denominator = pow(10n, BigInt(powerOfTen))
            const numerator = wholePart * denominator + fractionalPart
            value = new Fraction(numerator, denominator)
        }

        return new Operation(
            OperationTypes.Number,
            0,
            expression,
            value
        )
    }
}

class PruningEngine {
    sectionCache

    constructor() {
        this.sectionCache = {}
    }

    /**
    * @param {(left: Operation, right?: Operation) => (Operation | undefined)} op
    * @param {Operation} left
    * @param {Operation} right
    */
    applyOperation(op, left, right) {
        const result = op(left, right)
        if (result === undefined) return undefined

        result.digits = left.digits
        if (right !== undefined) result.digits += right.digits

        const numerator = result.value.numerator
        const denominator = result.value.denominator

        const bestSolForSection = this.sectionCache[numerator]?.[denominator]
            ?.[result.digits]
        if ((bestSolForSection !== undefined)
            && (result.numberOfOperations >= bestSolForSection.numberOfOperations)
            && (result.expression !== bestSolForSection.expression)) {
            return undefined
        }

        this.sectionCache[numerator] ||= {}
        this.sectionCache[numerator][denominator] ||= {}
        this.sectionCache[numerator][denominator][result.digits] = result
        return result
    }

    /**
    * @param {Operation} op
    */
    registerNumber(op) {
        this.sectionCache[op.value.numerator] ||= {}
        this.sectionCache[op.value.numerator][op.value.denominator] ||= {}
        this.sectionCache[op.value.numerator][op.value.denominator][op.digits] = op
    }
}
