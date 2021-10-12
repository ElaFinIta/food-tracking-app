'use strict';
import {FetchWrapper} from './fetch-wrapper.js';
import snackbar from 'snackbar';
import 'snackbar/dist/snackbar.min.css' 
import Chart from 'chart.js/auto';

const form = document.querySelector('#add-food-form');
const caloriesNumber = document.querySelector('#caloriesNumber');

const selectedFoodArea = document.querySelector('#food-select');
const givenCarbsArea = document.querySelector('#carbs');
const givenProteinsArea = document.querySelector('#prots');
const givenFatsArea = document.querySelector('#fats');
const ctx = document.getElementById('foodChart').getContext('2d');
const foodLogList = document.querySelector('#food-boxes-list');
let foodChart;  // need this globally to be able to destroy
let totalCalories = 0;


const url = 'https://firestore.googleapis.com/v1/projects/programmingjs-90a13/databases/(default)/documents/';
const myEndpoint = 'myfoodLog4';
const API = new FetchWrapper(url);


function calculateCalories(carbs, protein, fat) {
    let calories = (carbs*4)+(protein*4)+(fat*9);
    totalCalories += calories;
    return calories
}


function createFoodBox(carbs, protein, fat, name){
    const foodBox = document.createElement('li'); // create food box element
    foodBox.className = 'foodBox';

    const boxTitle = document.createElement('h3');  // food box title
    boxTitle.innerText = name;
    foodBox.appendChild(boxTitle);
    
    const calories = document.createElement('p'); // calories row
    calories.innerText = `${calculateCalories(carbs, protein, fat)} calories`;
    foodBox.appendChild(calories);

    const nutrients = document.createElement('ul');  // list of nutrients in food
    nutrients.className = 'list-in-box'; 

    const nutCarbs = document.createElement('li');  // carbs
    nutCarbs.innerText = `Carbs: ${carbs}g`;
    nutrients.appendChild(nutCarbs);

    const nutProt = document.createElement('li');  // protein
    nutProt.innerText = `Protein: ${protein}g`;
    nutrients.appendChild(nutProt);

    const nutFat = document.createElement('li');  // fat
    nutFat.innerText = `Fat: ${fat}g`;
    nutrients.appendChild(nutFat);

    foodBox.appendChild(nutrients);
    return foodBox;
}


function populateFoodLog() {
    let json = API.get(myEndpoint);
    json.then((data) => {
        for (let food of data.documents) {
            let foodBox = createFoodBox(
                food.fields.carbs.integerValue,
                food.fields.protein.integerValue,
                food.fields.fat.integerValue,
                food.fields.name.stringValue
            )
            foodLogList.appendChild(foodBox);  // append food box
        }
        caloriesNumber.innerText = totalCalories;
    }); 
}

populateFoodLog();

// 'empty' pie chart, before any food is added
foodChart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: ['empty'],
      datasets: [{
        data: [100],
        backgroundColor: [
          'rgba(227, 212, 189, 0',
        ],
        borderWidth: 2
      }]
    },
  });
    

form.addEventListener('submit', (event) => {
    event.preventDefault();

    // destroy previous chart to be able to draw another chart on the same canvas
    if (foodChart instanceof Chart) {
        foodChart.destroy(); 
    }

    const givenCarbs = givenCarbsArea.value;
    const givenProteins = givenProteinsArea.value;
    const givenFats = givenFatsArea.value;
    const selectedFood = selectedFoodArea.options[selectedFoodArea.selectedIndex].text;


    // new food to post into API - body
    let body = {
        fields: {
            fat: {
                integerValue: givenFats,
            },
            protein: {
                integerValue: givenProteins,
            },
            carbs: {
                integerValue: givenCarbs,
            },
            name: {
                stringValue: selectedFood,
            },
        },
    };
    
    // post food unless no food is selected
    if (body.fields.name.stringValue !== 'Please select') {
        API.post(myEndpoint, body).then(res => {
            if (res.fields) {
                snackbar.show('Food added succesfully');
            } else {
                snackbar.show('Some data is missing');
            };
        });
    } else {
        snackbar.show('Select a food');
    }

    // pie chart:
    // setup block
    const data = {
        labels: ['Carbs', 'Protein', 'Fat'],
        datasets: [{
            label: 'Nutrient composition',
            data: [givenCarbs, givenProteins, givenFats],
            backgroundColor: [
                'rgba(255, 99, 132, 0.7)',
                'rgba(54, 162, 235, 0.7)',
                'rgba(255, 206, 86, 0.7)',
            ],
            borderColor: [
                'rgba(255, 99, 132, 1)',
                'rgba(54, 162, 235, 1)',
                'rgba(255, 206, 86, 1)',
            ],
            borderWidth: 1
        }]
    };

    // options block
    // const options = {
    //     plugins: {
    //         legend: {
    //             display: false  // hide legend
    //         }
    //     }
    // };

    // config block
    const config = {
        type: 'pie',
        data,  // have to have data const defined first
        options: {}  // have to define options above, or put {}
    };

    // render block
    foodChart = new Chart(
        ctx,
        config // defined above
    );

    // append food box of freshly posted food
    foodLogList.appendChild(createFoodBox(givenCarbs, givenProteins, givenFats, selectedFood)); 
    caloriesNumber.innerText = totalCalories;
    form.reset();
});
