importScripts('./input_manipulation.js')

onmessage = function (event) {
    postMessage(event.data.year)
    console.log(event.data.year)
    console.log(startingNumbers)
    for (const startingSet of startingNumbers(event.data.year)) {
        postMessage(startingSet)
    }
}
