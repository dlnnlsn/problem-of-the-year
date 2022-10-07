#!/usr/bin/env python3

from fractions import Fraction

factorials = [Fraction(1)]
for n in range(1, 16):
    factorials += [n * factorials[n - 1]]

def nth_root(m, n):
    if m < 0 and (n % 2 == 0): return None
    if m < 0: return -nth_root(-m, n)
    lo = 0
    hi = m + 1
    while hi - lo > 1:
        mid = (hi + lo) // 2
        if (mid ** n) > m: hi = mid
        else: lo = mid
    return lo

def is_nth_power(m, n):
    root = nth_root(m, n)
    if root is None: return False
    return root**n == m

class Add:
    op = "Add"
    valid = lambda x, y: (y.op != "Min") and (y.op != "Add") and (y.op != "Sub")
    def __init__(self, a, b):
        self.value = a.value + b.value
        self.expr = f"({a.expr}) + ({b.expr})"

class Sub:
    op = "Sub"
    valid = lambda x, y: y.op != "Min" and (y.op != "Add") and (y.op != "Sub")
    def __init__(self, a, b):
        self.value = a.value - b.value
        self.expr = f"({a.expr}) - ({b.expr})"

class Mul:
    op = "Mul"
    valid = lambda x, y: y.op != "Min" and (y.op != "Mul") and (y.op != "Div")
    def __init__(self, a, b):
        self.value = a.value * b.value
        self.expr = f"({a.expr}) x ({b.expr})"

class Div:
    op = "Div"
    valid = lambda x, y: (y.value != 0) and (y.op != "Min") and (y.op != "Mul") and (y.op != "Div")
    def __init__(self, a, b):
        self.value = a.value / b.value
        self.expr = f"({a.expr}) / ({b.expr})"

class Num:
    op = "Num"
    def __init__(self, n):
        self.value = Fraction(n)
        self.expr = str(n)
        self.ops = 0

class Fac:
    op = "Fac"
    valid = lambda x: (x.value.denominator == 1) and (x.value >= 0) and (x.value < 15) and (x.value != 1)
    def __init__(self, a):
        self.value = factorials[a.value.numerator]
        self.expr = f"({a.expr})!"

class Min:
    op = "Min"
    valid = lambda x: x.op != "Min"
    def __init__(self, a):
        self.value = -a.value
        self.expr = f"-({a.expr})"

class Sqrt:
    op = "Sqrt"
    valid = lambda x: is_nth_power(x.value.numerator, 2) and is_nth_power(x.value.denominator, 2)
    def __init__(self, a):
        self.value = Fraction(nth_root(a.value.numerator, 2), nth_root(a.value.denominator, 2))
        self.expr = f"√({a.expr})"

class Exp:
    op = "Exp"
    valid = lambda x, y: is_nth_power(x.value.numerator, y.value.denominator) and is_nth_power(x.value.denominator, y.value.denominator) and ((x.value == 1) or (x.value == -1) or ((y.value > -20) and (y.value < 20))) and ((x.value != 0) or (y.value >= 0)) and (y.op != "Exp")
    def __init__(self, a, b):
        x, y = a.value, b.value
        flip = (y < 0)
        if flip: y = -y
        num = nth_root(x.numerator ** y.numerator, y.denominator)
        den = nth_root(x.denominator ** y.numerator, y.denominator)
        self.value = Fraction(den, num) if flip else Fraction(num, den)
        self.expr = f"({a.expr})^({b.expr})"

ops = [Add, Sub, Mul, Div, Exp]
unary_ops = [Fac, Min, Sqrt]

def step(nums):
    for i, x in enumerate(nums):
        for op in unary_ops:
            if not op.valid(x): continue
            val = op(x)
            val.ops = x.ops + 1
            yield nums[:i] + [val] + nums[i + 1:]
    for i in range(len(nums) - 1):
        for op in ops:
            x, y = nums[i], nums[i + 1]
            if not op.valid(x, y): continue
            val = op(x, y)
            val.ops = x.ops + y.ops + 1
            yield nums[:i] + [val] + nums[i + 2:]

def results(nums, max_steps = 3):
    if max_steps == 0: return []
    if len(nums) <= 1:
        res = nums[:]
        for op in unary_ops:
            if not op.valid(nums[0]): continue
            val = op(nums[0])
            val.ops = nums[0].ops + 1
            res += [val]
        return res
    res = []
    for s in step(nums):
        res.extend(results(s, max_steps - 1))
    return res

year = input()[:4]

res = []

for concat in range(8):
    breakpoints = [0]
    for i in range(3):
        if concat & (2**i): breakpoints.append(i + 1)
    breakpoints.append(4)
    nums = []
    valid = True
    for i in range(len(breakpoints) - 1):
        if year[breakpoints[i]] == '0' and (breakpoints[i + 1] != breakpoints[i] + 1):
            valid = False
            break
        nums.append(Num(int(year[breakpoints[i]: breakpoints[i + 1]])))
    if valid: res.extend(results(nums))

by_value = {}
for r in res:
    if r.value.denominator == 1:
        by_value[r.value.numerator] = by_value.setdefault(r.value.numerator, []) + [r]

upto = 1
while upto in by_value:
    by_value[upto].sort(key = lambda sol: sol.ops)
    print(upto, " = ", by_value[upto][0].expr)
    upto += 1
