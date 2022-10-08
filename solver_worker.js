importScripts('./input_manipulation.js')

onmessage = function (event) {
    for (const startingSet of startingNumbers(event.data.year)) {
        console.log(startingSet)
    }
}
