   
document.addEventListener("DOMContentLoaded", function() { 
    
    'use strict';
    
    var counter = {'hp': 0, 'atk': 0, 'def': 0, 'spatk': 0, 'spdef': 0, 'speed': 0},
        modifiers = {'pokerus': 0, 'brace': 0, 'power': 0, 'hordes': 0},
        altMode = false,
        log = []; // format for items in the log:    atk:+3
    
    
    // associative arrays for all interactable classes ----------------------
    
    var add1Buttons = document.getElementsByClassName("add-1"),
        add2Buttons = document.getElementsByClassName("add-2"),
        add3Buttons = document.getElementsByClassName("add-3"),
        allButtons = document.getElementsByClassName("ev-button"),
        modifierToggles = document.getElementsByClassName("multiplier-toggle"),
        manualInputs = document.getElementsByClassName("ev-input");
    
    // add event handlers ---------------------------
    
    document.getElementById("mode").onclick = switchMode;
    document.getElementById("reset").onclick = reset;
    document.getElementById("undo").onclick = undo;
    
    for (var i = 0, j = allButtons.length; i < j; i++) {
        allButtons[i].onclick = changeEVs;
    }
    
    for (var i = 0, j = modifierToggles.length; i < j; i++) {
        modifierToggles[i].onclick = toggleModifier;
    }
    
    for (var i = 0, j = manualInputs.length; i < j; i++) {
        manualInputs[i].onkeyup = manualOverride;
    }
    
    // Functions for buttons at the top of the page --------------------------
    // Mode Switch, Undo, and Reset All 
    
    function switchMode() {
        
        this.innerHTML = (altMode) ? "Switch to Super Training" : "Switch to Battle Training";
        altMode = (altMode) ? false : true;
        
        updateButtons();
        
    }
    
    
    function reset() {
        
        var stat;
        
        for (stat in counter) {
            counter[stat] = 0;
        }
        
        log = [];
        
        updateAll();
        
    }
    
    function undo() {
        
        var lastAction = log.pop();
        
        if (lastAction){
            var operators = {
                    '-': function (stat, val) { addEVs(stat, val); },
                    '+': function (stat, val) { removeEVs(stat, val); }
                },
                logEntry = lastAction.split(':'),
                stat = logEntry[0], // gets stat name
                op = logEntry[1][0], // gets operator and value
                val = logEntry[1].slice(1, logEntry[1].length); // removes operator from value

                operators[op](stat, val);
                updateGraph(stat);
                updateRemaining();
        }
        
    }
    
    
    // Functions called by event handlers --------------------------------------
    // Toggle Modifiers, EV +/- buttons, and manual input
    
    function toggleModifier() {
        
        var type = this.id,
            newClass = 'multiplier-toggle' + ((modifiers[type]) ? '' : ' on');
        
        if (type === 'power' || type === 'brace') {
            itemOverlapCheck(type);
        }
        
        modifiers[type] = (modifiers[type]) ? 0 : 1;
        
        changeClass(type, newClass);
        updateButtons();
        
    }
    
    function changeEVs() {
        
        var operators = { // easiest way I could think of to call different functions based on buttons
            '+': function (stat, v) { addEVs(stat, v); },
            '-': function (stat, v) { removeEVs(stat, v); }
        },
            stat = this.parentNode.id,
            v = this.innerHTML,
            val = checkLimits(stat, v);
        
        operators[v[0]](stat, val);
        
        updateGraph(stat);
        updateRemaining();
        
        if (val) {
            log.push(stat + ":" + v[0] + val);
        }
        
    }
    
    function manualOverride() {
        
        var stat = this.parentNode.id,
            eName = stat + '-input',
            newValue = this.value;
        
        if (newValue % 1 === 0) { // makes sure isn't NaN or some annoying value
            var val = newValue - counter[stat],
                change = (val > 0) ? ('+' + val) : ('-' + val);
            val = checkLimits(stat, change);
            counter[stat] += val;
        }
        
        changeValue(eName, counter[stat]);
        updateGraph(stat);
        updateRemaining();
        
        if (val) {
            log.push(stat + ":+" + val);
        }
        
    }
    
    
    // Helper functions -----------------------------------
    
    function itemOverlapCheck(type) { // power items / macho brace are mutually exlusive
        
        if (type === 'brace') {
            
            modifiers.power = 0;
            changeClass('power', 'multiplier-toggle');
            
        } else {
            
            modifiers.brace = 0;
            changeClass('brace', 'multiplier-toggle');
            
        }
        
    }
    
    // makes sure values are valid (0 to 255 in a single stat, 0 to 510 total)
    // still needs to return partial values to hit max values though, 
    // so it's a little more complicated than just checking the direct input
    
    function checkLimits(stat, v) {
        
        var operators = {
            '+': function (stat, val) { return 255 - (counter[stat] + val); }, // check positive inputs
            '-': function (stat, val) { return counter[stat] - val; } // check negative inputs
        },
            val = +v.slice(1, v.length), // remove non-number character from button input
            request = operators[v[0]](stat, val),
            total = updateTotal();
        
        // nothing to change with input if var request is positive, otherwise get amount needed to max
        val = (request > 0) ? val : (val - Math.abs(request));
        
        
        return (((total + val) <= 510) || v[0] === '-') ? val : (510 - total);
        
    }
    
    function addEVs(stat, val) {
        
        var eName = stat + '-input';
        counter[stat] += +val;
        changeValue(eName, counter[stat]);
        
    }
    
    function removeEVs(stat, val) {
        
        var eName = stat + '-input';
        counter[stat] -= +val;
        changeValue(eName, counter[stat]);
        
    }
    
    function changeValue(id, val) { document.getElementById(id).value = val;  }
    function changeHeight(id, val) { document.getElementById(id).style.height = val; }
    function changeText(id, val) { document.getElementById(id).innerHTML = val; }
    function changeClass(id, val) { document.getElementById(id).className = val; }
    
    function updateInput(stat) {
        
        var id = stat + '-input';
        changeValue(id, counter[stat]);
        
    }
    
    function updateGraph(stat) {
        
        var id = stat + '-bar',
            height = (counter[stat] / 255) * 95 + 5 + "px";
        
        changeHeight(id, height);
        
    }
    
    function updateRemaining() {
        
        var text = "EVs Remaining: " + (510 - updateTotal()) + "/510";
        changeText('ev-total', text);
        
    }
    
    function updateAll() { // really just called by the reset, otherwise it does faster, single updates
        
        var stat;
        
        for (stat in counter) {
            updateInput(stat);
            updateGraph(stat);
        }
        
        updateRemaining();
        
    }
    
    function updateButtons() {
        
        var add1 = (altMode) ? 4 : updateModifiers(1),
            add2 = (altMode) ? 8 : updateModifiers(2),
            add3 = (altMode) ? 12 : updateModifiers(3);
        
        for (var i = 0, j = add1Buttons.length; i < j; i++) {
            add1Buttons[i].innerHTML = '+' + add1;
        }
        
        for (var i = 0, j = add2Buttons.length; i < j; i++) {
            add2Buttons[i].innerHTML = '+' + add2;
        }
        
        for (var i = 0, j = add3Buttons.length; i < j; i++) {
            add3Buttons[i].innerHTML = '+' + add3;
        }
        
    }
    
    function updateModifiers(type) {
        
        var a = type,
            b = modifiers.power,
            c = modifiers.pokerus,
            d = modifiers.brace,
            e = modifiers.hordes;
        
        // all modifiers are binary, so this is pretty easy
        return (a + (b * 4)) * (1 + c) * (1 + d) * (1 + (e * 4));
    }
    
    function updateTotal() {
        
        var stat,
            total = 0;
        
        for (stat in counter) {
            total += counter[stat];
        }
        
        return total;
        
    }
    
});