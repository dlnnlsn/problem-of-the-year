import Data.List
import Data.Ratio
import qualified Data.Map as Map
import Data.Maybe
import Control.Monad

maxsteps = 8
allowomissions = 5

data Operation = Add | Subtract | Multiply | Divide | Factorial | UnaryMinus | SquareRoot | Exp | Number deriving (Eq)

data Result = Result {
    previousOp :: Operation,
    expression :: String,
    value :: Rational,
    ops :: Int
}

instance Show Result where show = expression
instance Eq Result where (==) a b = ops a == ops b
instance Ord Result where (<=) a b = ops a <= ops b

nthRoot :: Integer -> Integer -> Maybe Integer
nthRoot m n
    | m < 0 && even n = Nothing
    | m < 0 = Just $ -fromJust (nthRoot (-m) n)
    | m == 0 = Just 0
    | otherwise = Just $ nthRoot' m n (nthRootStep m n 1)

nthRoot' :: Integer -> Integer -> Integer -> Integer
nthRoot' m n x = let s = nthRootStep m n x in if x <= s then x else nthRoot' m n s

nthRootStep :: Integer -> Integer -> Integer -> Integer
nthRootStep m n x = ((n - 1) * x + (m `div` (x^(n - 1)))) `div` n

isNthPower :: Integer -> Integer -> Bool
isNthPower m n = case nthRoot m n of
    Just root -> root^n == m
    Nothing -> False 

number :: String -> Result
number s = Result {previousOp = Number, expression = s, value = parseNumber s, ops = 0}

simpleNumber :: Result -> Bool
simpleNumber x
    | previousOp x /= Number = False
    | head (expression x) == '0' = True
    | '.' `elem` expression x = False
    | otherwise = True

add :: Result -> Result -> Maybe Result
add x y
    | previousOp y == Add = Nothing
    | previousOp y == Subtract = Nothing
    | previousOp y == UnaryMinus = Nothing
    | otherwise = Just Result {
        previousOp = Add,
        expression = show x ++ " + " ++ show y,
        value = value x + value y,
        ops = ops x + ops y + 1
    }

sub :: Result -> Result -> Maybe Result
sub x y
    | previousOp y == Add = Nothing
    | previousOp y == Subtract = Nothing
    | previousOp y == UnaryMinus = Nothing
    | value y == 0 = Nothing -- Rather add 0
    | otherwise = Just Result {
        previousOp = Subtract,
        expression = show x ++ " - " ++ show y,
        value = value x - value y,
        ops = ops x + ops y + 1
    }

multiply :: Result -> Result -> Maybe Result
multiply x y
    | previousOp x == UnaryMinus = Nothing -- Force -(a x b) instead of (-a) x b
    | previousOp y == UnaryMinus = Nothing
    | previousOp y == Multiply = Nothing
    | previousOp y == Divide = Nothing
    | previousOp x == SquareRoot && previousOp y == SquareRoot = Nothing -- Can be combined into a single squareroot
    | value x == 0 && not (simpleNumber y) = Nothing
    | value y == 0 && not (simpleNumber x) = Nothing
    | value x == 1 && previousOp x == Factorial = Nothing -- 0! x a can be replaced with with 0 + a
    | value y == 1 && previousOp y == Factorial = Nothing
    | (value x == 2) && (value y == 2) = Nothing
    | otherwise = Just Result {
        previousOp = Multiply,
        expression = bracketForMultiply x ++ " x " ++ bracketForMultiply y,
        value = value x * value y,
        ops = ops x + ops y + 1 
    }

bracketForMultiply :: Result -> String
bracketForMultiply x
    | previousOp x `elem` [Add, Subtract, UnaryMinus] = "(" ++ show x ++ ")"
    | otherwise = show x

divide :: Result -> Result -> Maybe Result
divide x y
    | previousOp x == UnaryMinus = Nothing -- Force -(a/b) instead of (-a) / b
    | previousOp y == UnaryMinus = Nothing
    | previousOp y == Multiply = Nothing
    | previousOp y == Divide = Nothing
    | previousOp x == SquareRoot && previousOp y == SquareRoot = Nothing -- Can be combined into a single squareroot
    | value y == 0 = Nothing
    | value x == 0 = Nothing -- Rather multiply by 0
    | value y == 1 = Nothing -- Rather multiply by 1
    | value y == -1 = Nothing -- Rather multiply by -1
    | otherwise = Just Result {
        previousOp = Divide,
        expression = bracketNumerator x ++ " / " ++ bracketDenominator y,
        value = value x / value y,
        ops = ops x + ops y + 1
    }

bracketNumerator :: Result -> String
bracketNumerator x
    | previousOp x `elem` [Add, Subtract, UnaryMinus] = "(" ++ show x ++ ")"
    | otherwise = show x

bracketDenominator :: Result -> String
bracketDenominator x
    | previousOp x `elem` [SquareRoot, Factorial, Number] = show x
    | otherwise = "(" ++ show x ++ ")"

factorial :: Result -> Maybe Result
factorial x
    | denominator (value x) /= 1 = Nothing
    | value x < 0 = Nothing
    | value x == 1 = Nothing
    | value x > 20 = Nothing
    | otherwise = Just Result {
        previousOp = Factorial,
        expression = if previousOp x == Number then show x ++ "!" else "(" ++ show x ++ ")!",
        value = product [1..(numerator $ value x)] % 1,
        ops = ops x + 1
    }

unaryMinus :: Result -> Maybe Result
unaryMinus x
    | previousOp x == UnaryMinus = Nothing
    | previousOp x == Subtract = Nothing -- Force -a + b instead of -(a - b)
    | previousOp x == Add = Nothing -- Force -a - b instead of -(a + b)
    | value x == 0 = Nothing
    | otherwise = Just Result {
        previousOp = UnaryMinus,
        expression = if previousOp x == Number then "-" ++ show x else "-(" ++ show x ++")",
        value = -value x,
        ops = ops x + 1
    }

squareroot :: Result -> Maybe Result
squareroot x
    | value x == 0 = Nothing
    | value x == 1 = Nothing
    | not (isNthPower (numerator $ value x) 2) = Nothing 
    | not (isNthPower (denominator $ value x) 2) = Nothing
    | otherwise = Just Result {
        previousOp = SquareRoot,
        expression = "Sqrt(" ++ show x ++ ")",
        value = fromJust (nthRoot (numerator (value x)) 2) % fromJust (nthRoot (denominator (value x)) 2),
        ops = ops x + 1
    }

exponentiate :: Result -> Result -> Maybe Result
exponentiate x y
    | previousOp x == Exp = Nothing -- (a^b)^c = a^(b x c)
    | previousOp x == SquareRoot = Nothing -- Force Sqrt(a^b) instead of (Sqrt(a))^b
    | value y == 1 = Nothing -- Force a x 1 instead of a^1
    | value x == 1 && not (simpleNumber y) = Nothing
    | (value y > 100) && (1 /= value x) && ((-1) /= value x) = Nothing
    | (value y < (-100)) && (1 /= value x) && ((-1) /= value x) = Nothing
    | (value x == 0) && (value y /= 0) = Nothing -- 0^a becomes 0 x a
    | (value y == 0) && not (simpleNumber x) = Nothing
    | (value x == 2) && (value y == 2) = Nothing
    | not (isNthPower (numerator $ value x) (denominator $ value y)) = Nothing
    | not (isNthPower (denominator $ value x) (denominator $ value y)) = Nothing
    | otherwise = Just Result {
        previousOp = Exp,
        expression = bracketBase x ++ "^" ++ bracketExponent y,
        value = let
            shouldFlip = value y < 0
            a = if shouldFlip then 1 / value x else value x
            b = abs $ value y
            num = fromJust $ nthRoot (numerator a ^ numerator b) (denominator b)
            den = fromJust $ nthRoot (denominator a ^ numerator b) (denominator b)
            in num % den,
        ops = ops x + ops y + 1
    }
    
bracketBase :: Result -> String
bracketBase x
    | previousOp x == Number = show x
    | otherwise = "(" ++ show x ++ ")"

bracketExponent :: Result -> String
bracketExponent x
    | previousOp x `elem` [Number, Factorial, SquareRoot] = show x
    | otherwise = "(" ++ show x ++ ")"

breaks :: [t] -> [[[t]]]
breaks [] = [[]]
breaks xs = do
    (first, rest) <- tail $ zip (inits xs) (tails xs)
    other <- breaks rest
    return (first:other)

parseDecimal :: String -> Rational
parseDecimal s = let
    (whole, fraction) = break ('.' ==) s 
    powerOfTen = 10^(length fraction - 1)
    wholeAsInteger = read whole :: Integer
    fractionAsInteger = read (tail fraction) :: Integer
    in (wholeAsInteger * powerOfTen + fractionAsInteger) % powerOfTen

parseNumber :: String -> Rational
parseNumber s = if '.' `elem` s then parseDecimal s else (read s :: Integer) % 1

validGroupOption :: String -> Bool
validGroupOption ('0':'.':_) = True
validGroupOption "0" = True
validGroupOption ('0':_) = False
validGroupOption _ = True

optionsForGroup :: String -> [Result]
optionsForGroup s = map number $ filter validGroupOption (s : map (\(h, t) -> h ++ "." ++ t) (init $ tail $ zip (inits s) (tails s)))

optionsForBreak :: [String] -> [[Result]]
optionsForBreak = mapM optionsForGroup

startingNumbers :: String -> [[Result]]
startingNumbers = concatMap optionsForBreak . breaks

type ResultMap = Map.Map Integer Result

unaryOps :: [Result -> Maybe Result]
unaryOps = [factorial, unaryMinus, squareroot]

binaryOps :: [Result -> Result -> Maybe Result]
binaryOps = [add, sub, multiply, divide, exponentiate]

unaryStep :: [Result] -> [[Result]]
unaryStep xs = do
    (start, item:end) <- init $ zip (inits xs) (tails xs)
    op <- unaryOps
    let res = op item
    guard (isJust res)
    return (start ++ [fromJust res] ++ end)

binaryStep :: [Result] -> [[Result]]
binaryStep xs = do
    (start, x:y:end) <- init $ init $ zip (inits xs) (tails xs)
    op <- binaryOps
    let res = op x y
    guard (isJust res)
    return (start ++ [fromJust res] ++ end) 

step :: [Result] -> [[Result]]
step xs = unaryStep xs ++ binaryStep xs

updateSolutions :: Int -> ResultMap -> [Result] -> ResultMap
updateSolutions 0 sols _ = sols
updateSolutions _ sols [x]
    | value x < 0 = sols
    | denominator (value x) == 1 = Map.insertWith min (numerator $ value x) x sols
    | otherwise = sols
updateSolutions maxSteps sols xs = foldl' (updateSolutions (maxSteps - 1)) sols (step xs)

findSolutions :: [[Result]] -> ResultMap
findSolutions = foldl' (updateSolutions maxsteps) Map.empty

allSolutionsForYear :: String -> ResultMap
allSolutionsForYear = findSolutions . startingNumbers

printSolutions :: ResultMap -> IO ()
printSolutions = printSolutions' 1 allowomissions

printSolutions' :: Integer -> Integer -> ResultMap -> IO ()
printSolutions' num omissions sols = case Map.lookup num sols of
    Just res -> do
        putStr $ show num
        putStr " = "
        print res
        printSolutions' (num + 1) omissions sols 
    Nothing -> if omissions == 0 then return () else do
        putStrLn "~*~*~ We Cheated Here ~*~*~"
        printSolutions' (num + 1) (omissions - 1) sols
    
main :: IO ()
main = do
    year <- getLine
    printSolutions $ allSolutionsForYear year
