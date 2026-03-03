/**
 * Envark TUI Banner - ASCII Art Display
 */
import figlet from 'figlet';
import gradient from 'gradient-string';
import { colors } from './theme.js';
// Custom ASCII art for Envark
const ENVARK_ASCII = `
 ███████╗███╗   ██╗██╗   ██╗ █████╗ ██████╗ ██╗  ██╗
 ██╔════╝████╗  ██║██║   ██║██╔══██╗██╔══██╗██║ ██╔╝
 █████╗  ██╔██╗ ██║██║   ██║███████║██████╔╝█████╔╝ 
 ██╔══╝  ██║╚██╗██║╚██╗ ██╔╝██╔══██║██╔══██╗██╔═██╗ 
 ███████╗██║ ╚████║ ╚████╔╝ ██║  ██║██║  ██║██║  ██╗
 ╚══════╝╚═╝  ╚═══╝  ╚═══╝  ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝
`;
// Shield ASCII art
const SHIELD_ASCII = `
        ╔═══════════════╗
       ╔╝               ╚╗
      ╔╝   ◆ ENVARK ◆    ╚╗
     ╔╝                   ╚╗
    ╔╝   Environment       ╚╗
   ╔╝      Variable         ╚╗
   ║        Guardian         ║
   ╚╗                       ╔╝
    ╚╗                     ╔╝
     ╚╗                   ╔╝
      ╚╗                 ╔╝
       ╚╗               ╔╝
        ╚╗             ╔╝
         ╚╗           ╔╝
          ╚╗         ╔╝
           ╚╗       ╔╝
            ╚╗     ╔╝
             ╚╗   ╔╝
              ╚═══╝
`;
// Matrix-style dots pattern
const MATRIX_DOTS = `
·:·:+++++++:·:·          ·:·::  ·:·:·:·:          ·:·:·::+++++;:::+++*****++          ·:·:·:·:·:·:·:·:          ·:·:·:·:·:
;:; ++;;·                ·:·::. ·:·:·:            ·:·:::;++++++++;:;:;:;:;:;:;:·       ·:·::;:·:·::·:·          ·:·:·:·:·:·:
·:;:;:                   ·:·:·   ·:·:·:           ·:· :·:;:;+++++++;:;::·:·::··:       :·:·:·:·:·:·:·           ·:·:·;·+·:·:
·::·:·                          ·:·:·::·         :·::;:;;:;:;:;:;;;:;:·:·::·::·       :·:·:·:·:               ·;:;::·::·:·:·:
                                    ·::;;;;:;:;:;:;;:·                              ·::·:                   ·:·:·:·.:·:·:·:
                ·:·;:;:;:;:;:;:·:·                                                                          ·:;:;:·:·:·:·:·
`;
// Green gradient for cybersecurity feel
const greenGradient = gradient(['#003300', '#00ff00', '#00cc00']);
const cyanGradient = gradient(['#004444', '#00ffcc', '#00ff88']);
/**
 * Display the main banner
 */
export function displayBanner() {
    // Clear screen for clean look
    process.stdout.write('\x1Bc');
    // Display ASCII art with gradient
    console.log(greenGradient(ENVARK_ASCII));
    // Version and tagline
    console.log('');
    console.log(colors.primary(`                    Envark ${colors.dim('(v0.1.0)')}`));
    console.log(colors.dim('           Environment Variable Guardian'));
    console.log('');
}
/**
 * Display a compact header for subsequent screens
 */
export function displayHeader() {
    console.log('');
    console.log(colors.primary.bold('═══════════════════════════════════════════════════════════'));
    console.log(colors.primary.bold('  ◆ ENVARK') + colors.dim(' - Environment Variable Guardian'));
    console.log(colors.primary.bold('═══════════════════════════════════════════════════════════'));
    console.log('');
}
/**
 * Display the navigation hints at the bottom
 */
export function displayNavHints() {
    console.log('');
    console.log(colors.dim('Press ') +
        colors.primary('/') +
        colors.dim(' to see commands') +
        colors.dim('  •  ') +
        colors.dim('[') + colors.primary('tab') + colors.dim(']') +
        colors.dim(' autocomplete') +
        colors.dim('  •  ') +
        colors.dim('[') + colors.primary('Ctrl+C') + colors.dim(']') +
        colors.dim(' exit'));
    console.log('');
}
/**
 * Display a section header
 */
export function displaySection(title) {
    console.log('');
    console.log(colors.primary.bold(`┌─ ${title} ${'─'.repeat(Math.max(0, 55 - title.length))}┐`));
}
/**
 * Display a section footer
 */
export function displaySectionEnd() {
    console.log(colors.primary.bold(`└${'─'.repeat(58)}┘`));
}
/**
 * Generate figlet text
 */
export async function generateFiglet(text) {
    return new Promise((resolve, reject) => {
        figlet.text(text, {
            font: 'ANSI Shadow',
            horizontalLayout: 'default',
            verticalLayout: 'default',
        }, (err, data) => {
            if (err) {
                reject(err);
            }
            else {
                resolve(data || '');
            }
        });
    });
}
//# sourceMappingURL=banner.js.map