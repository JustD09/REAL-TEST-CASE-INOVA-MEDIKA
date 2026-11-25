<?php
echo "SCRIPT_NAME: "; var_dump($_SERVER["SCRIPT_NAME"] ?? "NOT SET");
echo "PHP_SELF: "; var_dump($_SERVER["PHP_SELF"] ?? "NOT SET");
echo "SCRIPT_FILENAME: "; var_dump($_SERVER["SCRIPT_FILENAME"] ?? "NOT SET");
echo "DOCUMENT_ROOT: "; var_dump($_SERVER["DOCUMENT_ROOT"] ?? "NOT SET");
echo "REQUEST_URI: "; var_dump($_SERVER["REQUEST_URI"] ?? "NOT SET");