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
        if (right.operationType == OperationTypes.Add) return undefined
        // Prefer (a + b) - c to a + (b - c)
        if (right.operationType == OperationTypes.Subtract) return undefined
        // Prefer a - b to a + (-b)
        if (right.operationType == OperationTypes.UnaryMinus) return undefined
        return new Operation(
            OperationTypes.Add,
            left.numberOfOperations + right.numberOfOperations + 1,
            left.expression + ' + ' + right.expression,
            Fraction.add(left.value, right.value) 
        )
    }
}
