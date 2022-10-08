importScripts("./math.js")

/** @type {Array<Fraction>} */
const factorials = [new Fraction(1, 1)]
for (let num = 1; num <= 20; ++num) {
    factorials.push(
        factorials[num - 1] * new Fraction(BigInt(num), 1)
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
        // Prefer a - b to a + (-b)
        if (right.operationType === OperationTypes.UnaryMinus) return undefined
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
        // Prefer a + b to a - (-b)
        if (right.operationType === OperationTypes.UnaryMinus) return undefined
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
        // Prefer Sqrt(a x b) to Sqrt(a) x Sqrt(b)
        if ((left.operationType === OperationTypes.SquareRoot) && (right.operationType === OperationTypes.SquareRoot)) return undefined
        // Prefer (number made up of digits of expression) x 0 to (complicated expression) x 0
        if (left.value.eq(0) && !isSimpleNumber(right)) return undefined
        // Prefer 0 x (number consisting of digits of expression) to 0 x (complicated expression)
        if (right.value.eq(0) && !isSimpleNumber(left)) return undefined
        // Prefer 0 + a to 0! x a (or 1 x a to 1! x a, but factorial already imposes this pruning)
        if (left.value.eq(1) && (left.operationType === OperationTypes.Factorial)) return undefined
        // Prefer a + 0 to a x 0!
        if (right.value.eq(1) && (right.operationType === OperationTypes.Factorial)) return undefined
        // A little silly to explicitly prune this, but prefer 2 + 2 to 2 x 2 😛
        if (left.value.eq(2) && right.value.eq(2)) return undefined

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
        // Prefer Sqrt(a / b) to Sqrt(a) / Sqrt(b)
        if ((left.operationType === OperationTypes.SquareRoot) && (right.operationType === OperationTypes.SquareRoot)) return undefined
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
        // Prefer 1 to 1!
        if (op.value.numerator === 1n) return undefined
        // Only allow small factorials
        if (op.value.numerator > 20) return undefined

        return new Operation(
            OperationTypes.Factorial,
            op.numberOfOperations + 1,
            op.operationType === OperationTypes.Number ? op.expression + "!" : "\\left(" + op.expression + "\\right)!",
            factorials[op.value.numerator]
        )
    }
}
