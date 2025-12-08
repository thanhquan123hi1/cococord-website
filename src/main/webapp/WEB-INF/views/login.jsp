<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<jsp:include page="/WEB-INF/includes/header.jsp">
    <jsp:param name="title" value="Login - CoCoCord"/>
</jsp:include>

<div class="min-h-screen flex items-center justify-center" style="background: linear-gradient(135deg, #5865f2 0%, #3ba55c 100%);">
    <div class="bg-gray-800 p-8 rounded-lg shadow-2xl w-full max-w-md">
        <div class="text-center mb-8">
            <i class="fas fa-comments text-5xl text-indigo-500 mb-4"></i>
            <h1 class="text-2xl font-bold text-white">Welcome back!</h1>
            <p class="text-gray-400">We're so excited to see you again!</p>
        </div>
        
        <form id="loginForm">
            <div class="mb-4">
                <label for="username" class="block text-gray-300 text-sm font-semibold mb-2">
                    USERNAME <span class="text-red-500">*</span>
                </label>
                <input type="text" 
                       class="discord-input w-full" 
                       id="username" 
                       name="username" 
                       required 
                       autocomplete="username"/>
            </div>
            
            <div class="mb-6">
                <label for="password" class="block text-gray-300 text-sm font-semibold mb-2">
                    PASSWORD <span class="text-red-500">*</span>
                </label>
                <input type="password" 
                       class="discord-input w-full" 
                       id="password" 
                       name="password" 
                       required
                       autocomplete="current-password"/>
                <a href="#" class="text-indigo-400 text-sm hover:underline mt-1 inline-block">Forgot your password?</a>
            </div>
            
            <button type="submit" class="btn-discord w-full py-3 text-lg font-semibold">
                Log In
            </button>
            
            <div id="errorMessage" class="mt-4 text-red-400 text-center hidden"></div>
        </form>
        
        <p class="text-gray-400 text-sm mt-4">
            Need an account? <a href="/register" class="text-indigo-400 hover:underline">Register</a>
        </p>
    </div>
</div>

<script>
$(document).ready(function() {
    // If already logged in, redirect to home
    if (CoCoCord.isAuthenticated()) {
        window.location.href = '/home';
        return;
    }
    
    $('#loginForm').on('submit', function(e) {
        e.preventDefault();
        
        const username = $('#username').val();
        const password = $('#password').val();
        const $btn = $(this).find('button[type="submit"]');
        const $error = $('#errorMessage');
        
        $btn.prop('disabled', true).html('<i class="fas fa-spinner fa-spin me-2"></i>Logging in...');
        $error.addClass('hidden');
        
        $.ajax({
            url: '/api/auth/login',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ username: username, password: password }),
            success: function(data) {
                sessionStorage.setItem('token', data.accessToken);
                window.location.href = '/home';
            },
            error: function(xhr) {
                $btn.prop('disabled', false).text('Log In');
                let msg = 'Login failed. Please check your credentials.';
                if (xhr.responseJSON && xhr.responseJSON.message) {
                    msg = xhr.responseJSON.message;
                }
                $error.text(msg).removeClass('hidden');
            }
        });
    });
});
</script>

<jsp:include page="/WEB-INF/includes/footer.jsp"/>
