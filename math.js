function gcd(m, n) {
    if (m < 0n) m = -m
    if (n < 0n) n = -n

    let tmp
    while (n !== 0n) {
        tmp = m
        m = n
        n = tmp % n
    }
    return m
}

class Fraction {
    constructor(numerator, denominator) {
        if (denominator === 0n) throw new Error("Division by zero")
        const g = gcd(numerator, denominator)
        let negative = (negative < 0n) ^ (denominator < 0n)
        if (numerator < 0n) numerator = -numerator
        if (negative) numerator = -numerator
        if (denominator < 0n) denominator = -denominator
        this.numerator = numerator / g
        this.denominator = denominator / g
    }

    static add(left, right) {
        const numerator = left.numerator * right.denominator + left.denominator * right.numerator
        const denominator = left.denominator * right.denominator
        return new Fraction(numerator, denominator)
    }

    static sub(left, right) {
        const numerator = left.numerator * right.denominator - left.denominator * right.numerator
        const denominator = left.denominator * right.denominator
        return new Fraction(numerator, denominator)
    }

    static mul(left, right) {
        const numerator = left.numerator * right.numerator
        const denominator = left.denominator * right.denominator
        return new Fraction(numerator, denominator)
    }

    static div(left, right) {
        const numerator = left.numerator * right.denominator
        const denominator = left.denominator * right.numerator
        return new Fraction(numerator, denominator)
    }

    static minus(frac) {
        return {
            numerator: -frac.numerator,
            denominator: frac.denominator
        }
    }

    eq(other) {
        if (typeof other === 'bigint') return (this.numerator === other) && (this.denominator === 1n)
        if (typeof other === 'number') return (this.numerator == other) && (this.denominator === 1n)
        return (this.numerator === other.numerator) && (this.denominator === other.denominator)
    }
}

function nthRootStep(m, n, x) {
    return ((n - 1) * x + m / (pow(x, n - 1))) / n
}

function nthRoot(m, n) {
    if ((m < 0) && ((n % 2) == 0)) return undefined
    if (m < 0) return -nthRoot(-m, n)
    let current = 1
    let next = nthRootStep(m, n, 1)
    do {
        current = next
        next = nthRootStep(m, n, next)
    } while (current > next)
    return current
}
