import fs from 'fs';

try {
    const report = JSON.parse(fs.readFileSync('lint_report.json', 'utf8'));
    let output = '';
    report.forEach(file => {
        if (file.errorCount > 0 || file.warningCount > 0) {
            output += `${file.filePath}: ${file.errorCount} errors, ${file.warningCount} warnings\n`;
            file.messages.forEach(msg => {
                output += `  Line ${msg.line}: ${msg.message} (${msg.ruleId})\n`;
            });
            output += '\n';
        }
    });
    fs.writeFileSync('lint_summary.txt', output);
    console.log("Summary written to lint_summary.txt");
} catch (e) {
    console.error("Error reading or parsing lint_report.json:", e);
}
