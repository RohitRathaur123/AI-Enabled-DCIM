// Moved: the assistant is now the global, reusable "AI Assistant"
// (src/Component/AIAssistant/AIAssistant.jsx), rendered once in
// Layout.jsx so it appears on every page. Kept as a re-export so any old
// import keeps working.
export { default } from "../AIAssistant/AIAssistant";
