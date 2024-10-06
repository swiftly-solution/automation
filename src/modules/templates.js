import { readFileSync } from 'fs'

export function FetchTemplate(template_name) {
    return readFileSync(`data/templates/${template_name}.tpl`).toString()
}

export function ReplacePlaceholder(template_str, key, value) {
    return template_str.replace(new RegExp(`\\[\\[${key}\\]\\]`, "g"), value)
}