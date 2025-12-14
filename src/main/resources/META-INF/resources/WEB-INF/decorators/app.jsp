<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%@ page import="org.sitemesh.content.Content" %>
<%
    Content sitemeshContent = (Content) request.getAttribute(Content.class.getName());
%>
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title><%
        if (sitemeshContent != null && sitemeshContent.getExtractedProperties().getChild("title").hasValue()) {
            out.print(sitemeshContent.getExtractedProperties().getChild("title").getValue());
        } else {
            out.print("CoCoCord App");
        }
    %></title>
    
    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
    
    <!-- Bootstrap 5 CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
    
    <!-- Bootstrap Icons -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css">
    
    <!-- Custom CSS for App -->
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/app.css">
    
    <%
        if (sitemeshContent != null) {
            sitemeshContent.getExtractedProperties().getChild("head").writeValueTo(out);
        }
    %>
</head>
<body class="app-layout">
    <!-- Main App Content (No Header/Footer for authenticated pages) -->
    <%
        if (sitemeshContent != null) {
            sitemeshContent.getExtractedProperties().getChild("body").writeValueTo(out);
        }
    %>

    <!-- Bootstrap Bundle JS -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
    
    <!-- SockJS & STOMP for WebSocket -->
    <script src="https://cdn.jsdelivr.net/npm/sockjs-client@1/dist/sockjs.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/stompjs@2.3.3/lib/stomp.min.js"></script>
    
    <!-- Custom JS for App -->
    <script src="${pageContext.request.contextPath}/js/auth.js"></script>
    <script src="${pageContext.request.contextPath}/js/app.js"></script>

    <%
        if (sitemeshContent != null) {
            sitemeshContent.getExtractedProperties().getChild("page.script").writeValueTo(out);
        }
    %>
</body>
</html>
