importScripts("./math.js")

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

function isSimpleNumber(op) {
    if (op.operationType !== OperationTypes.Number) return false
    if (op.expression.includes('.')) return op.expression[0] === '0'
    return true
}

class Operation {
    operationType
    numberOfOperations
    expression
    value

    constructor(operationType, numberOfOperations, expression, value) {
        this.operationType = operationType
        this.numberOfOperations = numberOfOperations
        this.expression = expression
        this.value = value
    }

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

    static #bracketForMultiply(op) {
        if ([OperationTypes.Add, OperationTypes.Subtract, OperationTypes.UnaryMinus].includes(op.operationType)) return "\\left(" + op.expression + "\\right)"
        return op.expression
    }

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
}
