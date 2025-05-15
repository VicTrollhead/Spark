#!/bin/bash

php artisan queue:listen

wait $!
