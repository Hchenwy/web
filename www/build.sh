#!/bin/sh
#change=`svn diff -r $1 --summarize  svn://10.18.75.12/BCR-X86-GW2.0/application/www  | awk -F'www' '{print $2}' `
#`find ./ -name "*.pyc" |xargs rm -rf`
#`python -c "import compileall; compileall.compile_dir('./server')"`
#for item in $change
#do
#    echo 'cp: '$item
#    item=${item/%py/pyc}
#    echo 'cp1: '$item
#    `cp --parents .$item $2/www`
#done

cp -rf server server_compile
`python2.7 -c "import compileall; compileall.compile_dir('server_compile')"`
`find server_compile  -name  *.py | xargs rm -fr`
mv server_compile $1/www/server
cp -a front $1/www

if [ $2 == "SURF" ]
then
        echo 'deal surf images'
        mv  $1/www/front/login/images/SURF/* $1/www/front/login/images
        rm -rf $1/www/front/login/images/SURF $1/www/front/login/images/BCR

        mv  $1/www/front/assets/images/SURF/* $1/www/front/assets/images
        rm -rf $1/www/front/assets/images/SURF $1/www/front/assets/images/BCR

elif [ $2 == "BCR" ]
then
        echo 'deal bcr images'
        mv $1/www/front/login/images/BCR/* $1/www/front/login/images
        rm -rf $1/www/front/login/images/BCR $1/www/front/login/images/SURF

        mv $1/www/front/assets/images/BCR/* $1/www/front/assets/images
        rm -rf $1/www/front/assets/images/BCR $1/www/front/assets/images/SURF
fi
