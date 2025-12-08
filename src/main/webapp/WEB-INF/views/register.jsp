<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<jsp:include page="/WEB-INF/includes/header.jsp">
    <jsp:param name="title" value="Register - CoCoCord"/>
</jsp:include>

<div class="min-h-screen flex items-center justify-center" style="background: linear-gradient(135deg, #5865f2 0%, #3ba55c 100%);">
    <div class="bg-gray-800 p-8 rounded-lg shadow-2xl w-full max-w-md">
        <div class="text-center mb-8">
            <i class="fas fa-user-plus text-5xl text-green-500 mb-4"></i>
            <h1 class="text-2xl font-bold text-white">Create an account</h1>
        </div>
        
        <form id="registerForm">
            <div class="mb-4">
                <label for="email" class="block text-gray-300 text-sm font-semibold mb-2">
                    EMAIL <span class="text-red-500">*</span>
                </label>
                <input type="email" 
                       class="discord-input w-full" 
                       id="email" 
                       name="email" 
                       required/>
            </div>
            
            <div class="mb-4">
                <label for="username" class="block text-gray-300 text-sm font-semibold mb-2">
                    USERNAME <span class="text-red-500">*</span>
                </label>
                <input type="text" 
                       class="discord-input w-full" 
                       id="username" 
                       name="username" 
                       required/>
            </div>
            
            <div class="mb-6">
                <label for="password" class="block text-gray-300 text-sm font-semibold mb-2">
                    PASSWORD <span class="text-red-500">*</span>
                </label>
                <input type="password" 
                       class="discord-input w-full" 
                       id="password" 
                       name="password" 
                       required/>
            </div>
            
            <button type="submit" class="btn-discord w-full py-3 text-lg font-semibold" style="background-color: #3ba55c;">
                Continue
            </button>
            
            <div id="errorMessage" class="mt-4 text-red-400 text-center hidden"></div>
            <div id="successMessage" class="mt-4 text-green-400 text-center hidden"></div>
        </form>
        
        <p class="text-gray-400 text-sm mt-4">
            Already have an account? <a href="/login" class="text-indigo-400 hover:underline">Log In</a>
        </p>
    </div>
</div>

<script>
$(document).ready(function() {
    if (CoCoCord.isAuthenticated()) {
        window.location.href = '/home';
        return;
    }
    
    $('#registerForm').on('submit', function(e) {
        e.preventDefault();
        
        const email = $('#email').val();
        const username = $('#username').val();
        const password = $('#password').val();
        const $btn = $(this).find('button[type="submit"]');
        const $error = $('#errorMessage');
        const $success = $('#successMessage');
        
        $btn.prop('disabled', true).html('<i class="fas fa-spinner fa-spin me-2"></i>Creating account...');
        $error.addClass('hidden');
        $success.addClass('hidden');
        
        $.ajax({
            url: '/api/auth/register',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ 
                email: email,
                username: username, 
                password: password 
            }),
            success: function(data) {
                $success.text('Account created successfully! Redirecting to login...').removeClass('hidden');
                setTimeout(function() {
                    window.location.href = '/login';
                }, 2000);
            },
            error: function(xhr) {
                $btn.prop('disabled', false).text('Continue');
                let msg = 'Registration failed. Please try again.';
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
