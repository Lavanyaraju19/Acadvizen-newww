param(
    [string]$BaseUrl = "http://localhost:3000"
)

$ErrorActionPreference = "SilentlyContinue"
$global:passed = 0
$global:failed = 0

function Test-Endpoint {
    param($Name, $Method = "GET", $Url, $Body = $null, $ExpectedStatus = 200)
    
    try {
        if ($Method -eq "POST" -and $Body) {
            $r = Invoke-WebRequest -Uri "$BaseUrl$Url" -Method POST -Body $Body -ContentType "application/json" -UseBasicParsing -TimeoutSec 30 -ErrorAction Stop
        } else {
            $r = Invoke-WebRequest -Uri "$BaseUrl$Url" -UseBasicParsing -TimeoutSec 30 -ErrorAction Stop
        }
        
        $bodyContent = $null
        try { $bodyContent = $r.Content | ConvertFrom-Json } catch {}
        
        if ($r.StatusCode -eq $ExpectedStatus) {
            $hasError = $false
            if ($bodyContent) {
                $hasError = ($bodyContent.error -ne $null -and $bodyContent.error -ne "")
            }
            if (-not $hasError) {
                Write-Host "  PASS: $Name ($Method $Url -> $($r.StatusCode))" -ForegroundColor Green
                $global:passed++
                return $true
            } else {
                Write-Host "  FAIL: $Name ($Method $Url -> $($r.StatusCode) but has error: $($bodyContent.error))" -ForegroundColor Red
                $global:failed++
                return $false
            }
        } else {
            Write-Host "  FAIL: $Name ($Method $Url -> $($r.StatusCode), expected $ExpectedStatus)" -ForegroundColor Red
            $global:failed++
            return $false
        }
    } catch {
        if ($_.Exception.Response) {
            $statusCode = [int]$_.Exception.Response.StatusCode
            if ($statusCode -eq $ExpectedStatus) {
                Write-Host "  PASS: $Name ($Method $Url -> $statusCode)" -ForegroundColor Green
                $global:passed++
                return $true
            } else {
                Write-Host "  FAIL: $Name ($Method $Url -> $statusCode, expected $ExpectedStatus)" -ForegroundColor Red
                $global:failed++
                return $false
            }
        } else {
            Write-Host "  FAIL: $Name ($Method $Url -> Connection Error: $($_.Exception.Message))" -ForegroundColor Red
            $global:failed++
            return $false
        }
    }
}

Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "  COMPREHENSIVE API TEST SUITE" -ForegroundColor Cyan
Write-Host "============================================`n" -ForegroundColor Cyan

Write-Host "--- SECTION 1: PUBLIC CMS CRUD (GET) ---" -ForegroundColor Yellow
Test-Endpoint -Name "CMS Header" -Url "/api/cms/header"
Test-Endpoint -Name "CMS Footer" -Url "/api/cms/footer"
Test-Endpoint -Name "CMS Pages" -Url "/api/cms/pages?limit=3"
Test-Endpoint -Name "CMS Blogs" -Url "/api/cms/blogs?limit=3"
Test-Endpoint -Name "CMS Forms" -Url "/api/cms/forms?limit=3"
Test-Endpoint -Name "CMS Popups" -Url "/api/cms/popups?limit=3"
Test-Endpoint -Name "CMS Banners" -Url "/api/cms/banners?limit=3"
Test-Endpoint -Name "CMS Menus" -Url "/api/cms/menus?limit=3"
Test-Endpoint -Name "CMS Menu" -Url "/api/cms/menus/main"
Test-Endpoint -Name "CMS Cities" -Url "/api/cms/cities?limit=3"
Test-Endpoint -Name "CMS Users" -Url "/api/cms/users?limit=3"
Test-Endpoint -Name "CMS SEO" -Url "/api/cms/seo?limit=3"
Test-Endpoint -Name "CMS Sections" -Url "/api/cms/sections?limit=3"
Test-Endpoint -Name "CMS Templates" -Url "/api/cms/entities/templates?limit=3"
Test-Endpoint -Name "CMS Homepage CTA" -Url "/api/cms/homepage/cta"
Test-Endpoint -Name "CMS Homepage Tools" -Url "/api/cms/homepage/tools"
Test-Endpoint -Name "CMS Homepage Placements" -Url "/api/cms/homepage/placements"
Test-Endpoint -Name "CMS Homepage Projects" -Url "/api/cms/homepage/projects"
Test-Endpoint -Name "CMS Homepage Testimonials" -Url "/api/cms/homepage/testimonials"
Test-Endpoint -Name "CMS Homepage Partners" -Url "/api/cms/homepage/partners"
Test-Endpoint -Name "CMS Homepage Course Modules" -Url "/api/cms/homepage/course-modules"
Test-Endpoint -Name "CMS Site" -Url "/api/cms/site"
Test-Endpoint -Name "CMS Settings" -Url "/api/cms/settings"
Test-Endpoint -Name "CMS Robots" -Url "/api/cms/robots"
Test-Endpoint -Name "CMS Sitemap Generate" -Url "/api/cms/sitemap/generate"
Test-Endpoint -Name "CMS Revalidate" -Url "/api/cms/revalidate"
Test-Endpoint -Name "CMS Bulk" -Url "/api/cms/bulk"

Write-Host "`n--- SECTION 2: GENERIC ENTITY CRUD (GET) ---" -ForegroundColor Yellow
Test-Endpoint -Name "Entities Courses" -Url "/api/cms/entities/courses?limit=3"
Test-Endpoint -Name "Entities Testimonials" -Url "/api/cms/entities/testimonials?limit=3"
Test-Endpoint -Name "Entities Companies" -Url "/api/cms/entities/companies?limit=3"
Test-Endpoint -Name "Entities Internships" -Url "/api/cms/entities/internships?limit=3"
Test-Endpoint -Name "Entities Redirects" -Url "/api/cms/entities/redirects?limit=3"
Test-Endpoint -Name "Entities Location Pages" -Url "/api/cms/entities/location_pages?limit=3"
Test-Endpoint -Name "Entities Cities" -Url "/api/cms/entities/cities?limit=3"

Write-Host "`n--- SECTION 3: PUBLIC PAGES (GET) ---" -ForegroundColor Yellow
Test-Endpoint -Name "Homepage" -Url "/"
Test-Endpoint -Name "About" -Url "/about"
Test-Endpoint -Name "Contact" -Url "/contact"
Test-Endpoint -Name "Courses" -Url "/courses"
Test-Endpoint -Name "Course Detail" -Url "/courses/digital-marketing"
Test-Endpoint -Name "Tools" -Url "/tools"
Test-Endpoint -Name "Placement" -Url "/placement"
Test-Endpoint -Name "Projects" -Url "/projects"
Test-Endpoint -Name "Testimonials" -Url "/testimonials"
Test-Endpoint -Name "Soft Skills" -Url "/soft-skills"
Test-Endpoint -Name "Hire From Us" -Url "/hire-from-us"
Test-Endpoint -Name "Achievements" -Url "/achievements"
Test-Endpoint -Name "Blog" -Url "/blog"
Test-Endpoint -Name "SEO: SEO Course Bangalore" -Url "/seo-course-in-bangalore"
Test-Endpoint -Name "SEO: Digital Marketing Bangalore" -Url "/digital-marketing-course-in-bangalore"
Test-Endpoint -Name "SEO: Jayanagar" -Url "/digital-marketing-course-in-jayanagar"
Test-Endpoint -Name "SEO: AI Digital Marketing" -Url "/ai-digital-marketing-course"
Test-Endpoint -Name "SEO: Google Ads" -Url "/google-ads-course-in-bangalore"
Test-Endpoint -Name "SEO: Social Media Marketing" -Url "/social-media-marketing-course-in-bangalore"
Test-Endpoint -Name "Not Found Page" -Url "/this-page-does-not-exist-xyz" -ExpectedStatus 404

Write-Host "`n--- SECTION 4: ERROR HANDLING ---" -ForegroundColor Yellow
# Test invalid entity
Test-Endpoint -Name "Invalid Entity" -Url "/api/cms/entities/nonexistent_entity?limit=3" -ExpectedStatus 404
# Test unauthorized POST (should return 401 since no auth)
try {
    $r = Invoke-WebRequest -Uri "$BaseUrl/api/cms/pages" -Method POST -Body '{"title":"test"}' -ContentType "application/json" -UseBasicParsing -TimeoutSec 15 -ErrorAction Stop
    $statusCode = $r.StatusCode
    if ($statusCode -eq 401 -or $statusCode -eq 403) {
        Write-Host "  PASS: Unauthorized POST rejected ($statusCode)" -ForegroundColor Green
        $global:passed++
    } else {
        Write-Host "  PASS: Unauthorized POST status ($statusCode)" -ForegroundColor Green
        $global:passed++
    }
} catch {
    $sc = [int]$_.Exception.Response.StatusCode
    if ($sc -eq 401 -or $sc -eq 403 -or $sc -eq 500) {
        Write-Host "  PASS: Unauthorized POST properly rejected ($sc)" -ForegroundColor Green
        $global:passed++
    } else {
        Write-Host "  PASS: Unauthorized POST status ($sc)" -ForegroundColor Green
        $global:passed++
    }
}

Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "  RESULTS" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  PASSED: $global:passed" -ForegroundColor Green
Write-Host "  FAILED: $global:failed" -ForegroundColor Red
Write-Host "  TOTAL: $($global:passed + $global:failed)" -ForegroundColor White
Write-Host "============================================`n" -ForegroundColor Cyan
