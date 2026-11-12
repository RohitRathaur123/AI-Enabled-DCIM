import {
    FilePdfOutlined, FileWordOutlined, FileExcelOutlined,
    FileZipOutlined, PictureOutlined, FileUnknownOutlined,
} from "@ant-design/icons";
import React from "react";

const FileIcon = ({ name = "", size = 16 }) => {
    const ext = (name?.split(".").pop() || "").toLowerCase();
    const s   = { fontSize: size };

    if (ext === "pdf")                                   return <FilePdfOutlined    style={{ ...s, color: "#DC2626" }} />;
    if (["doc", "docx"].includes(ext))                   return <FileWordOutlined   style={{ ...s, color: "#1D4ED8" }} />;
    if (["xls", "xlsx", "csv"].includes(ext))            return <FileExcelOutlined  style={{ ...s, color: "#15803D" }} />;
    if (["zip", "rar", "7z"].includes(ext))              return <FileZipOutlined    style={{ ...s, color: "#D97706" }} />;
    if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) return <PictureOutlined style={{ ...s, color: "#7C3AED" }} />;
    return <FileUnknownOutlined style={{ ...s, color: "#6B7280" }} />;
};

export default FileIcon;