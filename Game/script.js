let canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");

const playSpeed = 250; // ms

const minSizeOfData = 150;
const startNakazeno = 3;

const R = 3.0;
let smrtnost = 0.012;
let population = 10690000;
let pocetIteraciDne = 0;
let noveNakazenoReal = [];
const inkubDoba = 5;
const nemocDoba = 14;
const imunDoba = 90;
let kumulativniPocetNakazenych = [];
let noveUmrti = [];
let procentoNakazitelnych = 0;
let kumulativniPocetUmrti = 0;
let rZaDen = R / inkubDoba;
let realAktualneNakazeno = [];
let pocetPrenasecu = [];

let chart, chartData;

let playBool = false;


function addData(data) {
	let newDatum = plusDen(chart.data.labels[chart.data.labels.length - 1]);
	chart.data.labels.push(newDatum);
	chart.data.datasets.forEach((dataset) => {
		dataset.data.push(data);
	});
	removeData();
	/* if (chart.scales["y-axis-0"].max < 8000)
	chart.options.scales.yAxes[0].ticks.max = 8000; */
	chart.update();

	document.getElementById("datum").innerHTML = newDatum;
	document.getElementById("kumulativniUmrti").innerHTML = kumulativniPocetUmrti;
	document.getElementById("dnesUmrti").innerHTML = Math.round(noveUmrti[noveUmrti.length - 1]);
}

function removeData() {
	if (chart.data.labels.length - 1 >= minSizeOfData)
		chart.data.labels.shift();
	chart.data.datasets.forEach((dataset) => {
		if (dataset.data.length - 1 >= minSizeOfData)
			dataset.data.shift();
	});
	chart.update();
}

function initialize() {
	chartData = {
		labels: [],
		datasets: [{
			label: 'počet nakažených',
			data: [],
			backgroundColor: [
				'rgba(255, 99, 132, 0.3)'
			],
			borderColor: [
				'rgba(255, 99, 132, 1)'
			],
			borderWidth: 2,
			lineTension: 0
		}]
	};

	for (let i = 0; i < imunDoba; i++) {
		kumulativniPocetNakazenych.push(0);
	}

	kumulativniPocetNakazenych.push(startNakazeno);

	noveNakazenoReal.push(startNakazeno);
	realAktualneNakazeno.push(startNakazeno);
	pocetPrenasecu.push(startNakazeno);

	for (let i = 0; i < inkubDoba; i++) {
		let celkemPrenasecu = 0;
		for (let j = 0; j < i; j++) {
			celkemPrenasecu += noveNakazenoReal[j];
		}
		pocetPrenasecu.push(celkemPrenasecu);
		rZaDen = R;
		if (inkubDoba)
			rZaDen /= inkubDoba;
		rZaDen *= nakazitelni(kumulativniPocetNakazenych[kumulativniPocetNakazenych.length - imunDoba - 1], kumulativniPocetNakazenych[kumulativniPocetNakazenych.length - 1] + celkemPrenasecu, population);
		let newData = rZaDen * celkemPrenasecu;
		noveNakazenoReal.push(newData);
		realAktualneNakazeno.push(realAktualneNakazeno[realAktualneNakazeno.length - 1] + newData);
		kumulativniPocetNakazenych.push(kumulativniPocetNakazenych[kumulativniPocetNakazenych.length - 1] + newData);
	}

	noveUmrti.push(0);
	pocetIteraciDne = 1;


	for (let i = 0; i < inkubDoba; i++) {
		if (i == 0) {
			chartData.labels.push("2020-03-01")
		} else {
			chartData.labels.push(plusDen(chartData.labels[chartData.labels.length - 1]));
		}
		let celkemPrenasecu = 0;
		for (let j = 0; j < inkubDoba; j++) {
			celkemPrenasecu += noveNakazenoReal[j];
		}
		pocetPrenasecu.push(celkemPrenasecu);
		rZaDen = R;
		if (inkubDoba)
			rZaDen /= inkubDoba;
		rZaDen *= nakazitelni(kumulativniPocetNakazenych[kumulativniPocetNakazenych.length - imunDoba - 1], kumulativniPocetNakazenych[kumulativniPocetNakazenych.length - 1] + celkemPrenasecu, population);
		let newData = rZaDen * celkemPrenasecu;
		noveNakazenoReal.push(newData);
		kumulativniPocetNakazenych.push(kumulativniPocetNakazenych[kumulativniPocetNakazenych.length - 1] + newData);
		if (noveNakazenoReal[noveNakazenoReal.length - nemocDoba - 1]) {
			newData -= noveNakazenoReal[noveNakazenoReal.length - nemocDoba - 1];
			noveUmrti.push(smrtnost * noveNakazenoReal[noveNakazenoReal.length - nemocDoba - 1]);
		} else {
			noveUmrti.push(0);
		}
		kumulativniPocetUmrti += Math.round(noveUmrti[noveUmrti.length - 1]);
		realAktualneNakazeno.push(realAktualneNakazeno[realAktualneNakazeno.length - 1] + newData);
		chartData.datasets[0].data.push(Math.round(realAktualneNakazeno[realAktualneNakazeno.length - inkubDoba - 1]));
		pocetIteraciDne++;
	}

	Chart.defaults.global.elements.point.backgroundColor = 'rgba(255, 99, 132, 0.3)';
	Chart.defaults.global.elements.point.borderColor = 'rgba(255, 99, 132, .7)';
	Chart.defaults.global.elements.point.borderWidth = 1;


	chart = new Chart(ctx, {
		type: 'line',
		fill: 'start',
		data: chartData,
		options: {
			layout: {
				padding: {
					left: 0,
					right: 0,
					top: 0,
					bottom: 0,
				}
			},
			scales: {
				yAxes: [{
					ticks: {
						beginAtZero: true//,
					}/* ,
					type: 'logarithmic' */
				}],
				xAxes: [{
					ticks: {
						autoskip: true/* ,
						maxRotation: 0 */
					}
				}]
			}
		}
	});

	document.getElementById("datum").innerHTML = chartData.labels[chartData.labels.length - 1];
	document.getElementById("kumulativniUmrti").innerHTML = kumulativniPocetUmrti;
	document.getElementById("dnesUmrti").innerHTML = noveUmrti[noveUmrti.length - 1];
}
initialize();

document.getElementById("play").innerHTML = "PLAY";
function play() {
	if (!playBool) {
		document.getElementById("play").innerHTML = "PLAY";
		return;
	}
	document.getElementById("play").innerHTML = "PAUSE";
	addData(calcData());
	pocetIteraciDne++;

	setTimeout(play, playSpeed);
}

function calcData() {
	//let iDoba = imunDoba >= noveNakazenoReal.length ? (noveNakazenoReal.length - 1) : imunDoba;

	let celkemPrenasecu = 0;
	population -= noveUmrti[noveUmrti.length - 1];
	for (let i = realAktualneNakazeno.length - inkubDoba; i < realAktualneNakazeno.length; i++) {
		if (realAktualneNakazeno[i] + 1) {
			celkemPrenasecu += noveNakazenoReal[i];
		}
	}
	pocetPrenasecu.push(celkemPrenasecu);
	rZaDen = R;
	if (inkubDoba)
		rZaDen /= inkubDoba;
	rZaDen *= nakazitelni(kumulativniPocetNakazenych[kumulativniPocetNakazenych.length - 1 - imunDoba], kumulativniPocetNakazenych[kumulativniPocetNakazenych.length - 1] + celkemPrenasecu, population);
	let newData = rZaDen * celkemPrenasecu;
	noveNakazenoReal.push(newData);
	kumulativniPocetNakazenych.push(kumulativniPocetNakazenych[kumulativniPocetNakazenych.length - 1] + newData);

	if (noveNakazenoReal[noveNakazenoReal.length - nemocDoba - 1] + 1) {
		newData -= noveNakazenoReal[noveNakazenoReal.length - nemocDoba - 1];
		noveUmrti.push(smrtnost * noveNakazenoReal[noveNakazenoReal.length - nemocDoba - 1]);
	} else {
		noveUmrti.push(0);
	}
	kumulativniPocetUmrti += Math.round(noveUmrti[noveUmrti.length - 1]);

	realAktualneNakazeno.push(realAktualneNakazeno[realAktualneNakazeno.length - 1] + newData);
	return Math.round(realAktualneNakazeno[realAktualneNakazeno.length - inkubDoba - 1]);
}

function nakazitelni(predImunDobou, celkove, L) {
	return ((celkove - predImunDobou) < L ? ((L - celkove + predImunDobou) / L) : 0);
}