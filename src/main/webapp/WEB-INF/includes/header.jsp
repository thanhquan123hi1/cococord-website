<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${param.title != null ? param.title : 'CoCoCord'}</title>
    <!-- Bootstrap 5 CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    <!-- Font Awesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <!-- jQuery -->
    <script src="https://cdn.jsdelivr.net/npm/jquery@3.6.0/dist/jquery.min.js"></script>
    <!-- Custom Discord-like CSS -->
    <style>
        :root {
            --discord-dark: #36393f;
            --discord-darker: #2f3136;
            --discord-darkest: #202225;
            --discord-light: #dcddde;
            --discord-brand: #5865f2;
            --discord-green: #3ba55c;
            --discord-red: #ed4245;
            --discord-yellow: #faa61a;
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            background-color: var(--discord-dark);
            color: var(--discord-light);
            font-family: 'Whitney', 'Helvetica Neue', Helvetica, Arial, sans-serif;
            min-height: 100vh;
        }
        
        /* Navbar */
        .discord-nav {
            background-color: var(--discord-darkest);
            height: 48px;
            display: flex;
            align-items: center;
            padding: 0 16px;
            border-bottom: 1px solid rgba(0,0,0,0.2);
        }
        
        .discord-nav .brand {
            color: white;
            font-weight: bold;
            font-size: 1.2rem;
            text-decoration: none;
        }
        
        .discord-nav .brand:hover {
            color: var(--discord-brand);
        }
        
        /* Sidebar */
        .sidebar {
            background-color: var(--discord-darker);
            width: 240px;
            height: calc(100vh - 48px);
            overflow-y: auto;
        }
        
        .server-list {
            background-color: var(--discord-darkest);
            width: 72px;
            height: calc(100vh - 48px);
            padding: 12px 0;
            overflow-y: auto;
        }
        
        .server-icon {
            width: 48px;
            height: 48px;
            border-radius: 50%;
            background-color: var(--discord-dark);
            margin: 0 auto 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.2s;
        }
        
        .server-icon:hover {
            border-radius: 16px;
            background-color: var(--discord-brand);
        }
        
        .server-icon.active {
            border-radius: 16px;
            background-color: var(--discord-brand);
        }
        
        /* Channel list */
        .channel-item {
            padding: 8px 16px;
            margin: 2px 8px;
            border-radius: 4px;
            cursor: pointer;
            color: #8e9297;
            transition: all 0.1s;
        }
        
        .channel-item:hover {
            background-color: rgba(79, 84, 92, 0.4);
            color: var(--discord-light);
        }
        
        .channel-item.active {
            background-color: rgba(79, 84, 92, 0.6);
            color: white;
        }
        
        /* Chat area */
        .chat-container {
            background-color: var(--discord-dark);
            flex: 1;
            display: flex;
            flex-direction: column;
        }
        
        .messages-container {
            flex: 1;
            overflow-y: auto;
            padding: 16px;
        }
        
        .message {
            display: flex;
            padding: 4px 0;
            margin-bottom: 8px;
        }
        
        .message-avatar {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background-color: var(--discord-brand);
            margin-right: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .message-content {
            flex: 1;
        }
        
        .message-author {
            color: white;
            font-weight: 500;
            margin-bottom: 4px;
        }
        
        .message-text {
            color: var(--discord-light);
            line-height: 1.4;
        }
        
        /* Message input */
        .message-input-container {
            padding: 16px;
        }
        
        .message-input {
            background-color: #40444b;
            border: none;
            border-radius: 8px;
            padding: 12px 16px;
            color: var(--discord-light);
            width: 100%;
        }
        
        .message-input:focus {
            outline: none;
        }
        
        .message-input::placeholder {
            color: #72767d;
        }
        
        /* Members sidebar */
        .members-sidebar {
            background-color: var(--discord-darker);
            width: 240px;
            height: calc(100vh - 48px);
            padding: 16px;
            overflow-y: auto;
        }
        
        .member-item {
            display: flex;
            align-items: center;
            padding: 8px;
            border-radius: 4px;
            cursor: pointer;
        }
        
        .member-item:hover {
            background-color: rgba(79, 84, 92, 0.4);
        }
        
        .member-avatar {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background-color: var(--discord-brand);
            margin-right: 12px;
        }
        
        .status-indicator {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            position: absolute;
            bottom: 0;
            right: 0;
            border: 2px solid var(--discord-darker);
        }
        
        .status-online { background-color: var(--discord-green); }
        .status-idle { background-color: var(--discord-yellow); }
        .status-dnd { background-color: var(--discord-red); }
        .status-offline { background-color: #747f8d; }
        
        /* Buttons */
        .btn-discord {
            background-color: var(--discord-brand);
            color: white;
            border: none;
            padding: 10px 16px;
            border-radius: 4px;
            cursor: pointer;
            font-weight: 500;
            transition: background-color 0.2s;
        }
        
        .btn-discord:hover {
            background-color: #4752c4;
        }
        
        /* Form inputs */
        .discord-input {
            background-color: #202225;
            border: 1px solid #040405;
            border-radius: 4px;
            padding: 10px;
            color: var(--discord-light);
            width: 100%;
        }
        
        .discord-input:focus {
            outline: none;
            border-color: var(--discord-brand);
        }
        
        /* Scrollbar */
        ::-webkit-scrollbar {
            width: 8px;
        }
        
        ::-webkit-scrollbar-track {
            background: var(--discord-darker);
        }
        
        ::-webkit-scrollbar-thumb {
            background: var(--discord-darkest);
            border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
            background: #1a1b1e;
        }
    </style>
</head>
<body>