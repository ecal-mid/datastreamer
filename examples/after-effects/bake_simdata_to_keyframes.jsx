/**
 * SimData Keyframe Baker for Adobe After Effects
 * Reads a SimData CSV recording and bakes keyframes onto the currently selected property.
 *
 * Usage:
 * 1. Select a layer and a numeric property (e.g., Transform > Opacity, Scale, or an Expression Slider).
 * 2. File > Scripts > Run Script File... -> select this script.
 * 3. Choose the exported SimData .csv file.
 * 4. Enter the column name or index to bake.
 */

(function bakeSimDataKeyframes() {
    var comp = app.project.activeItem;
    if (!(comp instanceof CompItem)) {
        alert("Please select a composition first.");
        return;
    }

    var selectedProps = comp.selectedProperties;
    if (selectedProps.length === 0) {
        alert("Please select at least one animatable property (e.g. Opacity, Scale, or Slider Control).");
        return;
    }

    var targetProp = selectedProps[0];
    if (!targetProp.canVaryOverTime) {
        alert("Selected property cannot vary over time (not animatable).");
        return;
    }

    var csvFile = File.openDialog("Select a SimData CSV recording file", "*.csv");
    if (!csvFile) return;

    csvFile.open("r");
    var content = csvFile.read();
    csvFile.close();

    var lines = content.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
    if (lines.length < 2) {
        alert("The selected CSV file appears to be empty.");
        return;
    }

    var headers = lines[0].split(",");
    
    // Prompt user for column name or index
    var defaultCol = "respiration_value";
    var promptMsg = "Available columns:\n" + headers.join(", ") + "\n\nEnter column name or index (0-" + (headers.length - 1) + "):";
    var chosenCol = prompt(promptMsg, defaultCol);
    if (!chosenCol) return;

    var colIndex = -1;
    if (!isNaN(parseInt(chosenCol, 10)) && parseInt(chosenCol, 10) >= 0 && parseInt(chosenCol, 10) < headers.length) {
        colIndex = parseInt(chosenCol, 10);
    } else {
        for (var h = 0; h < headers.length; h++) {
            if (headers[h].toLowerCase() === chosenCol.toLowerCase().replace(/\s+/g, "")) {
                colIndex = h;
                break;
            }
        }
    }

    if (colIndex === -1) {
        alert("Column '" + chosenCol + "' not found in CSV.");
        return;
    }

    app.beginUndoGroup("Bake SimData Keyframes (" + headers[colIndex] + ")");

    var fps = comp.frameRate; // Usually 30 fps
    var startTime = comp.time;
    var count = 0;

    for (var i = 1; i < lines.length; i++) {
        var row = lines[i].split(",");
        if (row.length <= colIndex) continue;

        var val = parseFloat(row[colIndex]);
        if (isNaN(val)) continue;

        // Advance by frame index (assuming 30 Hz SimData output)
        var frameTime = startTime + ((i - 1) * (1.0 / 30.0));

        // Format according to property type (e.g., 2D array for scale)
        if (targetProp.propertyValueType === PropertyValueType.TwoD_SPATIAL ||
            targetProp.propertyValueType === PropertyValueType.TwoD) {
            targetProp.setValueAtTime(frameTime, [val * 100, val * 100]);
        } else if (targetProp.propertyValueType === PropertyValueType.ThreeD_SPATIAL ||
                   targetProp.propertyValueType === PropertyValueType.ThreeD) {
            targetProp.setValueAtTime(frameTime, [val * 100, val * 100, val * 100]);
        } else {
            targetProp.setValueAtTime(frameTime, val);
        }

        count++;
    }

    app.endUndoGroup();

    alert("Successfully baked " + count + " keyframes for '" + headers[colIndex] + "' starting at " + startTime.toFixed(2) + "s.");
})();

