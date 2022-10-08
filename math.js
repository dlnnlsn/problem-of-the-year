/**
* @param {bigint} m
* @param {bigint} n
* @returns {bigint}
*/
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
    /**
    * @param {bigint} numerator
    * @param {bigint} denominator
    * @throws {Error} If the denominator is 0
    * @returns {Fraction}
    */
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

    /**
    * @param {Fraction} left
    * @param {Fraction} right
    * @returns {Fraction}
    */
    static add(left, right) {
        const numerator = left.numerator * right.denominator + left.denominator * right.numerator
        const denominator = left.denominator * right.denominator
        return new Fraction(numerator, denominator)
    }

    /**
    * @param {Fraction} left
    * @param {Fraction} right
    * @returns {Fraction}
    */
    static sub(left, right) {
        const numerator = left.numerator * right.denominator - left.denominator * right.numerator
        const denominator = left.denominator * right.denominator
        return new Fraction(numerator, denominator)
    }

    /**
    * @param {Fraction} left
    * @param {Fraction} right
    * @returns {Fraction}
    */
    static mul(left, right) {
        const numerator = left.numerator * right.numerator
        const denominator = left.denominator * right.denominator
        return new Fraction(numerator, denominator)
    }

    /**
    * @param {Fraction} left
    * @param {Fraction} right
    * @throws {Error} If `right` is equal to 0
    * @returns {Fraction}
    */
    static div(left, right) {
        const numerator = left.numerator * right.denominator
        const denominator = left.denominator * right.numerator
        return new Fraction(numerator, denominator)
    }

    /**
    * @param {Fraction} frac
    * @returns {Fraction}
    */
    static minus(frac) {
        return new Fraction(-frac.numerator, frac.denominator)
    }

    /**
    * @param {Fraction | number | bigint} other
    * @returns {boolean}
    */
    eq(other) {
        if (typeof other === 'bigint') return (this.numerator === other) && (this.denominator === 1n)
        if (typeof other === 'number') return (this.numerator == other) && (this.denominator === 1n)
        return (this.numerator === other.numerator) && (this.denominator === other.denominator)
    }

    /**
    * @param {Fraction | number | bigint} other
    * @returns {boolean}
    */
    gt(other) {
        if (typeof other === 'number') return this.numerator > (BigInt(other) * this.denominator)
        if (typeof other === 'bigint') return this.numerator > (other * this.denominator)
        return (this.numerator * other.denominator) > (this.denominator * other.numerator)
    }

    /**
    * @param {Fraction | number | bigint} other
    * @returns {boolean}
    */
    lt(other) {
        if (typeof other === 'number') return this.numerator < (BigInt(other) * this.denominator)
        if (typeof other === 'bigint') return this.numerator < (other * this.denominator)
        return (this.numerator * other.denominator) < (this.denominator * other.numerator)
    }

    /**
    * @throws {Error} If value is 0
    * @returns {Fraction}
    */
    reciprocal() {
        return new Fraction(this.denominator, this.numerator)
    }
}

/**
* @param {bigint} m
* @param {bigint} n
* @param {bigint} x
* @returns {bigint}
*/
function nthRootStep(m, n, x) {
    return ((n - 1) * x + m / (pow(x, n - 1))) / n
}

/**
* @param {bigint} m
* @param {bigint} n
* @returns {bigint | undefined}
*/
function nthRoot(m, n) {
    if (n === 1n) return m
    if ((m < 0n) && ((n % 2n) == 0n)) return undefined
    if (m < 0n) return -nthRoot(-m, n)
    let current = 1n
    let next = nthRootStep(m, n, 1n)
    do {
        current = next
        next = nthRootStep(m, n, next)
    } while (current > next)
    if (pow(current, n) === m) return current
    return undefined
}

/**
* @param {bigint} base
* @param {bigint} exp
* @returns {bigint}
*/
function pow(base, exp) {
    if (base === 0n) return exp === 0n ? 1 : 0
    if (base === 1n) return 1n
    if (base === -1n) return exp % 2n === 1n ? -1n : 1n
    if (base === 2n) return 1n << exp

    let mask = 1n
    while (mask <= exp) mask <<= 1n
    let result = 1n
    while (mask > 1n) {
        mask >>= 1n
        result *= result
        if (exp & mask) result *= base
    }
    return result
}
