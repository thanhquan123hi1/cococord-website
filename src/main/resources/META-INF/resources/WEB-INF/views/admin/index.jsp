<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%--
  Admin Index Page
  This page is decorated by admin.jsp via SiteMesh.
  Only the <head> title and <body> content are extracted.
  The sidebar, topbar, and scripts are provided by the decorator.
--%>
<html>
<head>
    <title>CoCoCord Admin</title>
</head>
<body>
<%-- 
  The content area is managed by router.js which loads fragments dynamically.
  This page serves as the entry point and the body content will be ignored
  since the decorator provides the full layout with #admin-content div.
--%>
</body>
</html>
