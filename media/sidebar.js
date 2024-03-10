// 프로젝트 루트 위치에 있는 color.scss의 색상 변수값을 js로 가져온다.
// base.scss에 있는 색상 변수

// 현재 활성화된 파일의 색상 변수

function init() {}

export default function getBaseCssVariables() {
  const root = document.documentElement;
  const color = getComputedStyle(root).getPropertyValue("--color-primary");
  return `<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to GitOps - New User Guide</title>
      </head>
      <body>
        <h1>Base CSS Variables</h1>
        <p>Primary Color: ${color}</p>
      </body>
    </html>`;
}
