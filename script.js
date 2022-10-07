const yearInput = document.getElementById("year")

var worker = null

function findSolutions() {
    if (worker !== null) {
        worker.terminate()
    }
    worker = new Worker("./solver_worker.js")
    worker.onmessage = function(event) {
        alert(event.data)
    }
    worker.postMessage({ year: yearInput.value })
}
